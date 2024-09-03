import graphene
from .cinema import Query as CinemaQuery, Mutation as CinemaMutation
from .movie import Query as MovieQuery, Mutation as MovieMutation
from .ticket import Query as TicketQuery
from .user import Query as UserQuery, Mutation as UserMutation
from .admin import Mutation as AdminMutation
from .actor import Query as ActorQuery, Mutation as ActorMutation
from .schedule import Query as ScheduleQuery, Mutation as ScheduleMutation
from .mail import Mutation as MailMutation

class Query(UserQuery, CinemaQuery, MovieQuery, TicketQuery, ActorQuery, ScheduleQuery, graphene.ObjectType):
    pass

class Mutation(UserMutation, CinemaMutation, MovieMutation, AdminMutation, ActorMutation, ScheduleMutation, MailMutation, graphene.ObjectType):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)