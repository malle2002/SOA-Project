from mongoengine import IntField, BooleanField, EmbeddedDocument, StringField,EmbeddedDocumentField, ListField
from graphene_mongo import MongoengineObjectType
from graphene import List

class Seat(EmbeddedDocument):
    row = IntField(required=True)
    column = IntField(required=True)
    is_taken = BooleanField(default=False)
    seatGroup = StringField(required=True)

class SeatGroup(EmbeddedDocument):
    group_name = StringField(required=True)
    rows = IntField(required=True)       
    columns = IntField(required=True)
    seats = ListField(EmbeddedDocumentField(Seat)) 
    
class SeatType(MongoengineObjectType):
    class Meta:
        model = Seat

class SeatGroupType(MongoengineObjectType):
    class Meta:
        model = SeatGroup
    seats = List(SeatType)