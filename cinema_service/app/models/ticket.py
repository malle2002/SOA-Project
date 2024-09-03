from mongoengine import Document, ReferenceField, DateTimeField, ListField, EmbeddedDocumentField, IntField, StringField
from .seat import Seat
from .movie import MovieModel
from .cinema import CinemaModel

class TicketModel(Document):
    meta = {'collection': 'tickets'}
    user = StringField(required=True)
    movie = ReferenceField(MovieModel, required=True)
    cinema = ReferenceField(CinemaModel, required=True)
    duration = IntField(required=True)
    start_time = StringField(required=True)
    seats = ListField(EmbeddedDocumentField(Seat), required=True)
    reserved_at = DateTimeField(required=True)
