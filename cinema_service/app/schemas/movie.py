import graphene
from graphene_mongo import MongoengineObjectType
from app.models.movie import MovieModel, Comment
from app.models.user import UserModel
from graphene import String, Int, Field, List, ID
from mongoengine.queryset.visitor import Q
from mongoengine import DoesNotExist
import random
from app.models.actor import ActorModel

class CommentType(MongoengineObjectType):
    class Meta:
        model = Comment

class MovieType(MongoengineObjectType):
    class Meta:
        model = MovieModel
    comments = graphene.List(CommentType)
    actors = graphene.List(lambda: ActorType)

from .actor import ActorType
  
class CreateMovie(graphene.Mutation):
    class Arguments:
        title = graphene.String(required=True)
        genres = graphene.List(graphene.String, required=True)
        duration = graphene.Int(required=True)
        poster_url = graphene.String(required=True)
        video_url = graphene.String(required=True)
        description = graphene.String(required=True)
        actor_ids = graphene.List(graphene.ID)

    movie = Field(lambda: MovieType)

    def mutate(self, info, title, genres, duration, poster_url, video_url, description, actor_ids):
        actors = [ActorModel.objects.get(id=actor_id) for actor_id in actor_ids]
        movie = MovieModel(
            title=title,
            genres=genres,
            duration=int(duration),
            poster_url=poster_url,
            video_url=video_url,
            description=description,
            actors=actors
        )
        for actor in actors:
            if actor:
                actor.movies.append(movie.id)
                actor.save()
        movie.save()
        return CreateMovie(movie=movie)

class DeleteMovie(graphene.Mutation):
    class Arguments:
        movie_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, movie_id):
        try:
            movie = MovieModel.objects.get(id=movie_id)
            for actor_id in movie.actors:
                actor = ActorModel.objects(id=actor_id).first()
                if actor and movie.id in actor.movies:
                    actor.movies.remove(movie.id)
                    actor.save()
            movie.delete()
            success = True
        except MovieModel.DoesNotExist:
            success = False

        return DeleteMovie(success=success)

class EditMovie(graphene.Mutation):
    class Arguments:
        movie_id = graphene.String(required=True)
        new_title = graphene.String()
        new_genres = List(graphene.String)
        new_duration = graphene.Int()
        new_poster_url = graphene.String()
        new_video_url = graphene.String()
        new_description = graphene.String()
        new_actor_ids = graphene.List(graphene.ID)

    success = graphene.Boolean()

    def mutate(self, info, movie_id, new_title=None, new_genres=None, new_duration=None, new_poster_url=None, new_video_url=None, new_description=None, new_actor_ids=None):
        try:
            movie = MovieModel.objects.get(id=movie_id)
            new_actors = [ActorModel.object.get(id=aid) for aid in new_actor_ids]
            if new_title:
                movie.title = new_title
            if new_genres:
                movie.genres = new_genres
            if new_duration:
                movie.duration = new_duration
            if new_poster_url:
                movie.poster_url = new_poster_url
            if new_video_url:
                movie.video_url = new_video_url
            if new_description:
                movie.description = new_description
            if new_actors is not None:
                current_actors = set(movie.actors)
                new_actors_set = set(new_actors)
                
                actors_to_remove = current_actors - new_actors_set
                for actor_id in actors_to_remove:
                    actor = ActorModel.objects(id=actor_id).first()
                    if actor and movie.id in actor.movies:
                        actor.movies.remove(movie.id)
                        actor.save()
                
                actors_to_add = new_actors_set - current_actors
                for actor_id in actors_to_add:
                    actor = ActorModel.objects.get_or_create(id=actor_id)
                    if movie.id not in actor.movies:
                        actor.movies.append(movie.id)
                    actor.save()
                
                movie.actors = new_actors
            movie.save()
            success = True
        except MovieModel.DoesNotExist:
            success = False

        return EditMovie(success=success)

class RateMovie(graphene.Mutation):
    class Arguments:
        movie_id = graphene.String(required=True)
        rating = graphene.Float(required=True)
        user_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, movie_id, rating, user_id):
        movie = MovieModel.objects(id=movie_id).first()

        if user_id in movie.ratedBy:
            raise Exception("You have already rated this movie.")

        if movie:
            movie.update_rating(rating, user_id)
            return RateMovie(success=True)
        return RateMovie(success=False)

class AddCommentMutation(graphene.Mutation):
    class Arguments:
        movie_id = String(required=True)
        username = String(required=True)
        content = String(required=True)

    success = graphene.Boolean()
    movie = Field(MovieType)
    error = String()

    def mutate(self, info, movie_id, username, content):
        try:
            movie = MovieModel.objects.get(id=movie_id)
        except DoesNotExist:
            return AddCommentMutation(success=False, error="Movie not found")

        try:
            user = UserModel.objects.filter(username=username).first()
        except DoesNotExist:
            return AddCommentMutation(success=False, error="User not found")

        movie.add_comment(username, content)
        return AddCommentMutation(success=True, movie=movie)

class Query(graphene.ObjectType):
    all_movies_page = graphene.List(MovieType, limit=Int(), skip=Int(), genre=String())
    fetch_movie = graphene.Field(MovieType, movie_id=graphene.String(required=True))
    search_movies_page = graphene.List(MovieType, query=String(required=True), limit=Int(), skip=Int(), genre=String())
    movie_count = graphene.Int(genre=String())
    search_movie_count = graphene.Int(query=String(required=True), genre=String())
    random_movies = graphene.List(MovieType, count=Int(required=True))

    def resolve_all_movies_page(self, info, limit=None, skip=None, genre=None):
        query = MovieModel.objects.order_by('-id')
        if genre:
            query = query.filter(genres__icontains=genre)
        if skip:
            query = query.skip(skip)
        if limit:
            query = query.limit(limit)
        return list(query)

    def resolve_fetch_movie(self, info, movie_id):
        movie = MovieModel.objects(id=movie_id).first()
        if not movie:
            raise Exception(f"Movie with id {movie_id} not found")
        return movie

    def resolve_search_movies_page(self, info, query, limit=None, skip=None, genre=None):
        query_set = MovieModel.objects.order_by('-id').filter(
            Q(title__icontains=query)
        )
        if genre:
            query_set = query_set.filter(genres__icontains=genre)
        if skip:
            query_set = query_set.skip(skip)
        if limit:
            query_set = query_set.limit(limit)
        return list(query_set)

    def resolve_movie_count(self, info, genre=None):
        query = MovieModel.objects
        if genre:
            query = query.filter(genres__icontains=genre)
        return query.count()

    def resolve_search_movie_count(self, info, query, genre=None):
        query_set = MovieModel.objects.filter(
            Q(title__icontains=query)
        )
        if genre:
            query_set = query_set.filter(genres__icontains=genre)
        return query_set.count()

    def resolve_random_movies(self, info, count):
        movies = list(MovieModel.objects.all())
        random.shuffle(movies)
        return movies[:count]

class Mutation(graphene.ObjectType):
    create_movie = CreateMovie.Field()
    delete_movie = DeleteMovie.Field()
    edit_movie = EditMovie.Field()
    rate_movie = RateMovie.Field()
    add_comment = AddCommentMutation.Field()
