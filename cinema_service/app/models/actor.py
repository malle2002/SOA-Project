from mongoengine import StringField,ListField,ReferenceField,Document

class ActorModel(Document):
    meta = {'collection': 'actors'}
    name = StringField(required=True, unique=True)
    movies = ListField(ReferenceField('MovieModel'))