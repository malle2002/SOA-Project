from graphene_mongo import MongoengineObjectType
from ..models.schedule import ScheduleItem,Schedule,ScheduleDay
from ..models.cinema import CinemaModel
from ..models.seat import SeatGroupType
from ..models.movie import MovieModel as Movie
from ..models.cinema import CinemaModel as Cinema
from .ticket import TicketType, TicketModel as Ticket
from datetime import timedelta, datetime
import graphene
from graphene import List, InputObjectType

class SeatInputType(InputObjectType):
    seatGroup = graphene.String(required=True)
    row = graphene.Int(required=True)
    column = graphene.Int(required=True)
class ScheduleItemType(MongoengineObjectType):
    class Meta:
        model = ScheduleItem
    seats = List(SeatGroupType)       
class ScheduleDayType(MongoengineObjectType):
    class Meta:
        model = ScheduleDay
class ScheduleType(MongoengineObjectType):
    class Meta:
        model = Schedule
    schedule_days = List(ScheduleDayType)

class AddScheduleItem(graphene.Mutation):
    class Arguments:
        schedule_day = graphene.String(required=True)
        movie_id = graphene.String(required=True)
        start_time = graphene.String(required=True)
        duration = graphene.Int(required=True)
        cinema_id = graphene.String(required=True)
        price = graphene.Int(required=True)

    ok = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, schedule_day, movie_id, start_time, duration, cinema_id, price):
        schedule = Schedule.objects(cinema_id=cinema_id).first()
        cinema = CinemaModel.objects(id=cinema_id).first()
        
        if not schedule:
            schedule = Schedule.create_cinema_schedule(cinema_id)
            
        if not cinema:
            return AddScheduleItem(ok=False, message="Invalid cinema")
            
        day = next((d for d in schedule.schedule_days if d.day == schedule_day), None)
        if not day:
            return AddScheduleItem(ok=False, message="Invalid schedule day")
        
        start_time_dt = datetime.strptime(start_time, '%Y-%m-%dT%H:%M')
        end_time_dt = start_time_dt + timedelta(minutes=duration + 30)
        for item in day.schedule_items:
            item_start = item.start_time
            item_end = item.start_time + timedelta(minutes=item.duration + 30)
            if (item_start < end_time_dt and item_end > start_time_dt):
                return AddScheduleItem(ok=False, message="Schedule item overlaps with an existing item")
        
        new_item = ScheduleItem(movie_id=movie_id, cinema_id=cinema_id, start_time=start_time_dt, duration=duration, seats=cinema.seat_groups, price=price)
        day.schedule_items.append(new_item)
        schedule.save()

        return AddScheduleItem(ok=True, message="Schedule item added successfully")
class CheckSeatsAvailability(graphene.Mutation):
    class Arguments:
        cinema_id = graphene.String(required=True)
        schedule_day = graphene.String(required=True)
        movie_id = graphene.String(required=True)
        start_time = graphene.String(required=True)
        seats = List(SeatInputType, required=True)
        
    are_seats_taken = graphene.Boolean()

    def mutate(self, info, cinema_id, schedule_day, movie_id, start_time, seats):
        schedule = Schedule.objects(cinema_id=cinema_id).first()
        if not schedule:
            return CheckSeatsAvailability(are_seats_taken=False)

        day = next((d for d in schedule.schedule_days if d.day == schedule_day), None)
        if not day:
            return CheckSeatsAvailability(are_seats_taken=False)
        dt = datetime.fromisoformat(start_time)
        formatted_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        
        for item in day.schedule_items:
            if item.movie_id == movie_id and item.start_time.strftime("%Y-%m-%d %H:%M:%S") == formatted_str:
                seat_groups = {sg.group_name: sg for sg in item.seats}
                
                for seat in seats:
                    group = seat_groups.get(seat.seatGroup)
                    if not group:
                        continue
                    
                    seat_obj = next((s for s in group.seats if s.row == seat.row and s.column == seat.column), None)
                    if seat_obj and seat_obj.is_taken:
                        return CheckSeatsAvailability(are_seats_taken=True)
                
        return CheckSeatsAvailability(are_seats_taken=False)          
class BookSeats(graphene.Mutation):
    class Arguments:
        cinema_id = graphene.String(required=True)
        schedule_day = graphene.String(required=True)
        movie_id = graphene.String(required=True)
        start_time = graphene.String(required=True)
        seats = List(SeatInputType, required=True)
        user_id = graphene.String(required=True)
        duration = graphene.Int(required=True)
        
    ticket = graphene.Field(TicketType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, cinema_id, schedule_day, movie_id, start_time, seats, user_id, duration):
        checkSeatsAvailability = CheckSeatsAvailability.mutate(self, info, cinema_id, schedule_day, movie_id, start_time, seats)
        if checkSeatsAvailability.are_seats_taken:
            return BookSeats(success=False, message="Seats were taken in meanwhile", ticket=None)
        
        schedule = Schedule.objects(cinema_id=cinema_id).first()
        
        if not schedule:
            return BookSeats(success=False, message="There is no schedule for current cinema", ticket=None)
        
        day = next((d for d in schedule.schedule_days if d.day == schedule_day), None)
        if not day:
            
            return BookSeats(success=False, message="The day is invalid", ticket=None)
        dt = datetime.fromisoformat(start_time)
        formatted_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        
        for item in day.schedule_items:
            if item.movie_id == movie_id and item.start_time.strftime("%Y-%m-%d %H:%M:%S") == formatted_str:
                seat_groups = {sg.group_name: sg for sg in item.seats}
                for seat in seats:
                    group = seat_groups.get(seat.seatGroup)
                    if not group:
                        continue
                    
                    seat_obj = next((s for s in group.seats if s.row == seat.row and s.column == seat.column), None)
                    if seat_obj and not seat_obj.is_taken:
                        seat_obj.is_taken = True
        schedule.save()  
        newTicket = Ticket(
            user = user_id,
            movie = Movie.objects(id=movie_id).first(),
            cinema = Cinema.objects(id=cinema_id).first(),
            duration = duration,
            start_time = start_time,
            seats = seats,
            reserved_at = datetime.now()
        )    
        newTicket.save()
        ticket=newTicket
        return BookSeats(success=True, message="Seats are booked successfully", ticket=ticket)

class Mutation(graphene.ObjectType):
    add_schedule_item = AddScheduleItem.Field()
    check_seats_availability = CheckSeatsAvailability.Field() 
    book_seats = BookSeats.Field()  
class Query(graphene.ObjectType):
    schedules = graphene.List(ScheduleType, cinema_id=graphene.String(required=True))
    schedule_item = graphene.Field(ScheduleItemType, cinema_id=graphene.String(required=True), movie_id=graphene.String(required=True), day=graphene.String(required=True), start_time=graphene.String(required=True))
    
    def resolve_schedules(self, info, cinema_id):
        return Schedule.objects(cinema_id=cinema_id)
    def resolve_schedule_item(self, info, cinema_id, movie_id, day, start_time):
        schedules = Schedule.objects(cinema_id=cinema_id)
        for schedule in schedules:
            for schedule_day in schedule.schedule_days:
                if schedule_day.day == day:
                    for schedule_item in schedule_day.schedule_items:
                        if (schedule_item.movie_id == movie_id and
                                schedule_item.start_time.isoformat() == start_time):
                            return schedule_item
        return None