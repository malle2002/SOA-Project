from mongoengine import Document, StringField, ListField,\
DateTimeField, IntField, EmbeddedDocument, EmbeddedDocumentField, EmbeddedDocumentListField
from .seat import SeatGroup

class ScheduleItem(EmbeddedDocument):
    movie_id = StringField(required=True)
    cinema_id = StringField(required=True)
    duration = IntField(required=True)
    start_time = DateTimeField(required=True)
    price = IntField(required=True)
    seats = EmbeddedDocumentListField(SeatGroup)
    
    def __str__(self):
        return f"ScheduleItem(movie_id={self.movie_id}, cinema_id={self.cinema_id}, duration={self.duration}, start_time={self.start_time}, price={self.price}, seats={self.seats})"

class ScheduleDay(EmbeddedDocument):
    day = StringField(required=True)
    schedule_items = ListField(EmbeddedDocumentField(ScheduleItem))

class Schedule(Document):
    cinema_id = StringField(required=True, unique=True)
    schedule_days = ListField(EmbeddedDocumentField(ScheduleDay))

    @staticmethod
    def create_cinema_schedule(cinema_id):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        schedule_days = [ScheduleDay(day=day, schedule_items=[]) for day in days]
        schedule = Schedule(cinema_id=cinema_id, schedule_days=schedule_days)
        schedule.save()
        return schedule