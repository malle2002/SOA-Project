import graphene
from graphene_mongo import MongoengineObjectType
from app.models.cinema import CinemaModel
from graphene import String, Int, Field
from mongoengine.queryset.visitor import Q
from ..models.cinema import WorkingDay
from ..models.seat import Seat,SeatGroup,SeatGroupType,SeatType

class WorkingDayInput(graphene.InputObjectType):
    day = graphene.String()
    start_time = graphene.String()
    end_time = graphene.String()
    
class WorkingDayType(graphene.ObjectType):
    day = graphene.String()
    start_time = graphene.String()
    end_time = graphene.String()

class SeatInput(graphene.InputObjectType):
    row = graphene.Int()
    column = graphene.Int()
    is_taken = graphene.Boolean()

class SeatGroupInput(graphene.InputObjectType):
    group_name = graphene.String()
    rows = graphene.Int()
    columns = graphene.Int()
    seats = graphene.List(SeatInput)

class CinemaType(MongoengineObjectType):
    class Meta:
        model = CinemaModel
    working_days = graphene.List(WorkingDayType)
    seat_groups = graphene.List(SeatGroupType)
    
class CreateCinema(graphene.Mutation):
    class Arguments:
        name = String(required=True)
        location = String(required=True)
        imageUrl = String(required=True)
        working_days = graphene.List(WorkingDayInput, required=False)
        seat_groups = graphene.List(SeatGroupInput, required=False)

    cinema = Field(lambda: CinemaType)
    
    def mutate(self, info, name, location, imageUrl, working_days, seat_groups=None):
        if working_days:
            for wd in working_days:
                if isinstance(wd.day, str):
                    wd.day = eval(wd.day)[1]
                if isinstance(wd.start_time, str):
                    wd.start_time = eval(wd.start_time)[1]
                if isinstance(wd.end_time, str):
                    wd.end_time = eval(wd.end_time)[1]
                if wd.day not in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                    raise ValueError(f"Invalid day value: {wd.day}")
                
        if seat_groups:
            for sg in seat_groups:
                for seat in sg.seats:
                    if seat.row < 1 or seat.column < 1:
                        raise ValueError("Seat row and column must be positive integers.")        
                
        cinema = CinemaModel(
            name=name,
            location=location,
            imageUrl=imageUrl,
            working_days= [
                WorkingDay(day=wd.day, start_time=wd.start_time, end_time=wd.end_time)
                for wd in working_days
            ],
            seat_groups=[SeatGroup(
                group_name=sg.group_name,
                rows=sg.rows,
                columns=sg.columns,
                seats=[Seat(row=seat.row, column=seat.column, is_taken=False, seatGroup=sg.group_name) for seat in sg.seats] if sg.seats else []
            ) for sg in seat_groups] if seat_groups else []
        )
        cinema.save()
        return CreateCinema(cinema=cinema)  
class DeleteCinema(graphene.Mutation):
    class Arguments:
        cinema_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, cinema_id):
        cinema = CinemaModel.objects(id=cinema_id).first()
        if cinema:
            cinema.delete()
            return DeleteCinema(success=True)
        return DeleteCinema(success=False) 
class EditCinema(graphene.Mutation):
    class Arguments:
        cinema_id = graphene.ID(required=True)
        new_name = graphene.String()
        new_location = graphene.String()
        new_imageUrl = graphene.String()
        new_working_days = graphene.List(WorkingDayInput)
        new_seat_groups = graphene.List(SeatGroupInput)

    success = graphene.Boolean()
    def mutate(self, info, cinema_id, new_name=None, new_location=None, new_imageUrl=None, new_working_days=None, new_seat_groups=None):
        try:
            if new_working_days:
                for wd in new_working_days:
                    if isinstance(wd.day, str):
                        wd.day = eval(wd.day)[1]
                    if isinstance(wd.start_time, str):
                        wd.start_time = eval(wd.start_time)[1]
                    if isinstance(wd.end_time, str):
                        wd.end_time = eval(wd.end_time)[1]
                    if wd.day not in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                        raise ValueError(f"Invalid day value: {wd.day}")
                    
            cinema = CinemaModel.objects.get(id=cinema_id)
            if new_name:
                cinema.name = new_name
            if new_location:
                cinema.location = new_location
            if new_imageUrl:
                cinema.imageUrl = new_imageUrl
            if new_working_days is not None:
                cinema.working_days = [
                    WorkingDay(day=wd.day, start_time=wd.start_time, end_time=wd.end_time)
                    for wd in new_working_days
                ]
            if new_seat_groups is not None:
                cinema.seat_groups = [
                    SeatGroup(
                        group_name=sg.group_name,
                        rows=sg.rows,
                        columns=sg.columns,
                        seats=[Seat(row=seat.row, column=seat.column, is_taken=False, seatGroup=sg.group_name) for seat in sg.seats] if sg.seats else []
                    )
                    for sg in new_seat_groups
                ] if new_seat_groups else []
            print(new_seat_groups)
            cinema.save()
            success = True
        except CinemaModel.DoesNotExist:
            success = False

        return EditCinema(success=success)
class RateCinema(graphene.Mutation):
    class Arguments:
        cinema_id = graphene.ID(required=True)
        rating = graphene.Float(required=True)
        user_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, cinema_id, rating, user_id):
        cinema = CinemaModel.objects(id=cinema_id).first()

        if user_id in cinema.ratedBy:
            raise Exception("You have already rated this cinema.")

        if cinema:
            cinema.update_rating(rating, user_id)
            return RateCinema(success=True)
        return RateCinema(success=False)
class Query(graphene.ObjectType):
    all_cinemas = graphene.List(CinemaType, limit=Int(), skip=Int())
    fetch_cinema = graphene.Field(CinemaType, cinema_id=graphene.String(required=True))
    search_cinemas = graphene.List(CinemaType, query=String(required=True), limit=Int(), skip=Int())
    cinema_count = graphene.Int()
    search_cinema_count = graphene.Int(query=String(required=True))

    def resolve_all_cinemas(self, info, limit=None, skip=None):
        query = CinemaModel.objects
        if skip:
            query = query.skip(skip)
        if limit:
            query = query.limit(limit)
        return list(query)
    
    def resolve_fetch_cinema(self, info, cinema_id):
        cinema = CinemaModel.objects(id=cinema_id).first()
        if not cinema:
            raise Exception(f"Cinema with id {cinema_id} not found")
        return cinema
    
    def resolve_search_cinemas(self, info, query, limit=None, skip=None):
        if not query.isnumeric():
            query_set = CinemaModel.objects.filter(
                Q(name__icontains=query) | Q(location__icontains=query) 
            )
        else:
            query_set = CinemaModel.objects.filter(
                Q(name__icontains=query) | Q(location__icontains=query)
            )
        if skip:
            query_set = query_set.skip(skip)
        if limit:
            query_set = query_set.limit(limit)
        return list(query_set)
    
    def resolve_cinema_count(self, info):
        return CinemaModel.objects.count()
    
    def resolve_search_cinema_count(self, info, query):
        query_set = CinemaModel.objects.filter(
            Q(name__icontains=query) | Q(location__icontains=query)
        )
        return query_set.count()   
class Mutation(graphene.ObjectType):
    create_cinema = CreateCinema.Field()
    delete_cinema = DeleteCinema.Field()
    edit_cinema = EditCinema.Field()
    rate_cinema = RateCinema.Field()