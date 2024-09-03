from mongoengine import Document, StringField, IntField, ListField,FloatField,EmbeddedDocument,EmbeddedDocumentField,ReferenceField
import time
from .actor import ActorModel

class Comment(EmbeddedDocument):
    username = StringField(required=True)
    content = StringField(required=True)
    timestamp = FloatField(required=True)
    
class MovieModel(Document):
    meta = {'collection': 'movies'}
    title = StringField(required=True)
    genres = ListField(StringField(), required=True)
    duration = IntField(required=True)
    poster_url = StringField()
    video_url = StringField()
    description = StringField()
    rating = FloatField(default=0.0)
    ratedBy = ListField(StringField())
    comments = ListField(EmbeddedDocumentField(Comment))
    actors = ListField(ReferenceField(ActorModel))
    
    def update_rating(self, new_rating, user_id):
        if user_id in self.ratedBy:
            raise Exception("You have already rated this movie.")

        current_rating = self.rating if self.rating else 0.0
        total_ratings = len(self.ratedBy) if hasattr(self, 'ratedBy') else 0
        new_total_ratings = total_ratings + 1
        new_avg_rating = (current_rating * total_ratings + new_rating) / new_total_ratings
        self.rating = new_avg_rating
        self.ratedBy.append(user_id)
        self.save()
        
    def add_comment(self, username, content):
        comment = Comment(username=username, content=content, timestamp=time.time())
        self.comments.append(comment)
        self.save()
