from mongoengine import Document, StringField, IntField, FloatField, ListField,\
EmbeddedDocument, EmbeddedDocumentField, ValidationError,EmbeddedDocumentListField
from .seat import SeatGroup

class WorkingDay(EmbeddedDocument):
    day = StringField(required=True, choices=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    start_time = StringField(required=True)
    end_time = StringField(required=True)

class CinemaModel(Document):
    meta = {'collection': 'cinemas'}
    name = StringField(required=True)
    location = StringField(required=True)
    rating = FloatField(default=0.0)
    imageUrl = StringField()
    ratedBy = ListField(StringField())
    working_days = ListField(EmbeddedDocumentField(WorkingDay))
    seat_groups = EmbeddedDocumentListField(SeatGroup)
    
    def update_rating(self, new_rating, user_id):
        if user_id in self.ratedBy:
            raise Exception("You have already rated this cinema.")

        current_rating = self.rating if self.rating else 0.0
        total_ratings = len(self.ratedBy) if hasattr(self, 'ratedBy') else 0
        new_total_ratings = total_ratings + 1
        new_avg_rating = (current_rating * total_ratings + new_rating) / new_total_ratings
        self.rating = new_avg_rating
        self.ratedBy.append(user_id)
        self.save()

    def add_working_day(self, day, start_time, end_time):
        if any(work_day.day == day for work_day in self.working_days):
            raise ValidationError(f"{day} is already added as a working day.")
        
        if len(self.working_days) >= 7:
            raise ValidationError("Cannot add more than 7 working days.")
        
        new_working_day = WorkingDay(day=day, start_time=start_time, end_time=end_time)
        self.working_days.append(new_working_day)
        self.save()