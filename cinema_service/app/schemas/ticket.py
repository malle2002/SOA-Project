import graphene
from graphene_mongo import MongoengineObjectType
from app.models.ticket import TicketModel
from graphene import String

class TicketType(MongoengineObjectType):
    class Meta:
        model = TicketModel
        
class Query(graphene.ObjectType):
    all_tickets = graphene.List(TicketType)
    tickets_by_user = graphene.List(TicketType, userId=String(required=True))
    fetch_ticket = graphene.Field(TicketType, id=String(required=True))

    def resolve_all_tickets(self, info):
        return list(TicketModel.objects)
    def resolve_tickets_by_user(self, info, userId):
        return list(TicketModel.objects(user=userId))
    def resolve_fetch_ticket(self, info, id):
        ticket = TicketModel.objects(id=id).first()
        if not ticket:
            raise Exception("Ticket not found")
        return ticket