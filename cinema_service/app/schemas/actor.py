from graphene_mongo import MongoengineObjectType
from ..models.actor import ActorModel
import graphene
from graphene import String, List, ID, Int
from ..models.movie import MovieModel
from .movie import MovieType
from mongoengine.queryset.visitor import Q

class ActorType(MongoengineObjectType):
    class Meta:
        model = ActorModel
    
class CreateActor(graphene.Mutation):
    class Arguments:
        name = String(required=True)
        movie_ids = List(ID, required=True)

    actor = graphene.Field(ActorType)

    def mutate(self, info, name, movie_ids):
        movies = [MovieModel.objects.get(id=movie_id) for movie_id in movie_ids]
        actor = ActorModel(name=name, movies=[movie.title for movie in movies])
        for movie in movies:
            movie.actors.add(actor.id)
            movie.save()
        actor.save()
        return CreateActor(actor=actor)
    
class DeleteActor(graphene.Mutation):
    class Arguments:
        actor_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, actor_id):
        try:
            actor = ActorModel.objects.get(id=actor_id)
            for movie_id in actor.movies:
                movie = MovieModel.objects(id=movie_id).first()
                if movie and actor.id in movie.actors:
                    movie.actors.remove(actor.id)
                    movie.save()
            actor.delete()
            success = True
        except ActorModel.DoesNotExist:
            success = False

        return DeleteActor(success=success)
    
class EditActor(graphene.Mutation):
    class Arguments:
        actor_id = graphene.String(required=True)
        name = graphene.String()
        movie_ids = graphene.List(graphene.String)

    actor = graphene.Field(ActorType)

    def mutate(self, info, actor_id, name=None, movie_ids=None):
        actor = ActorModel.objects(id=actor_id).first()
        new_movies = [MovieModel.objects.get(id=movie_id) for movie_id in movie_ids]
        if not actor:
            raise Exception("Actor not found")
        if name:
            actor.name = name 
        if new_movies is not None:
            current_movies = set(actor.movies)
            new_movies_set = set(new_movies)
            
            movies_to_remove = current_movies - new_movies_set
            for movie_id in movies_to_remove:
                movie = MovieModel.objects(id=movie_id).first()
                if movie and actor.id in movie.actors:
                    movie.actors.remove(actor.id)
                    movie.save()
            
            movies_to_add = new_movies_set - current_movies
            for movie_id in movies_to_add:
                movie = MovieModel.objects.get_or_create(id=movie_id)
                if actor.id not in movie.actors:
                    movie.actors.append(actor.id)
                movie.save()
            
            actor.movies = new_movies

        actor.save()
        return EditActor(actor=actor)

class Query(graphene.ObjectType):
    all_actors = graphene.List(ActorType, query=String(), limit=Int(), skip=Int())
    movies_by_actor = graphene.List(MovieType, actor_id=String(required=True), limit=Int(), skip=Int(), genre=String())
    search_movies_by_actor = graphene.List(MovieType, actor_id=String(required=True), query=String(required=True), limit=Int(), skip=Int(), genre=String())
    actors_count = graphene.Int()
    search_actors_count = graphene.Int(query=String(required=True))
    fetch_actor = graphene.Field(ActorType, actor_id=graphene.String(required=True))
    movie_actor_count = graphene.Int(actor_id=graphene.String(required=True), genre=String())
    search_movie_actor_count = graphene.Int(actor_id=graphene.String(required=True), query=String(required=True), genre=String())
    
    def resolve_all_actors(self, info, query=None, limit=None, skip=None):
        actor_query = ActorModel.objects
        if query:
            actor_query = actor_query.filter(name__icontains=query)
        if skip:
            actor_query = actor_query.skip(skip)
        if limit:
            actor_query = actor_query.limit(limit)
        return list(actor_query)

    def resolve_movies_by_actor(self, info, actor_id, limit=None, skip=None, genre=None):
        actor = ActorModel.objects.filter(id=actor_id).first()
        if not actor:
            raise Exception("Actor not found")
        movie_ids = [movie.id for movie in actor.movies]
        query_set = MovieModel.objects.filter(id__in=movie_ids)
        query_set = query_set.order_by('-id')
        if genre:
            query_set = query_set.filter(genres__icontains=genre)
        if skip:
            query_set = query_set.skip(skip)
        if limit:
            query_set = query_set.limit(limit)
        return list(query_set)
        
    def resolve_search_movies_by_actor(self, info, actor_id, query, limit=None, skip=None, genre=None):
        actor = ActorModel.objects.filter(id=actor_id).first()
        if not actor:
            raise Exception("Actor not found")
        movie_ids = [movie.id for movie in actor.movies]
        query_set = MovieModel.objects.filter(Q(id__in=movie_ids) & Q(title__icontains=query))
        query_set = query_set.order_by('-id')
        if genre:
            query_set = query_set.filter(genres__icontains=genre)
        if skip:
            query_set = query_set.skip(skip)
        if limit:
            query_set = query_set.limit(limit)
        return list(query_set)

    def resolve_actors_count(self, info):
        return ActorModel.objects.count()

    def resolve_search_actors_count(self, info, query):
        return ActorModel.objects.filter(name__icontains=query).count()

    def resolve_fetch_actor(self, info, actor_id):
        actor = ActorModel.objects(id=actor_id).first()
        if not actor:
            raise Exception("Actor not found")
        return actor
 
    def resolve_movie_actor_count(self, info, actor_id, genre=None):
        actor = ActorModel.objects.filter(id=actor_id).first()
        if not actor:
            raise Exception("Actor not found")
        movie_ids = [movie.id for movie in actor.movies]
        query_set = MovieModel.objects.filter(id__in=movie_ids)
        query_set.filter(genres__icontains=genre)
        return query_set.count()

    def resolve_search_movie_actor_count(self, info, actor_id, query, genre=None):
        actor = ActorModel.objects.filter(id=actor_id).first()
        if not actor:
            raise Exception("Actor not found")
        movie_ids = [movie.id for movie in actor.movies]
        query_set = MovieModel.objects.filter(id__in=movie_ids)
        query_set.filter(Q(genres__icontains=genre) & Q(title__icontains=query))
        return query_set.count()
    
class Mutation(graphene.ObjectType):
    create_actor = CreateActor.Field()
    delete_actor = DeleteActor.Field()
    edit_actor = EditActor.Field()