import graphene
from flask_mail import Mail, Message
from flask import current_app

class SendEmail(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        subject = graphene.String(required=True)
        message = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, email, subject, message):
        mail = current_app.extensions['mail']

        msg = Message(
            subject=subject,
            sender=email,
            recipients=['master_atanasov2002@hotmail.com'],
            body=message,
            reply_to=email
        )

        try:
            mail.send(msg)
            return SendEmail(success=True)
        except Exception as e:
            print(f'Error sending email: {e}')
            return SendEmail(success=False)

class Mutation(graphene.ObjectType):
    send_email = SendEmail.Field()