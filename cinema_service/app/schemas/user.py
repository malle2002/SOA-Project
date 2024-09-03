import graphene
from graphene_mongo import MongoengineObjectType
from app.models.user import UserModel
from graphene import String, Field, Int, Boolean
from mongoengine.queryset.visitor import Q
from app.verify_captcha import verify_captcha
import jwt
from dotenv import load_dotenv
import os
from app.util.reset_password import send_password_reset_email

class UserType(MongoengineObjectType):
    class Meta:
        model = UserModel
class CreateUser(graphene.Mutation):
    class Arguments:
        username = String(required=True)
        email = String(required=True)
        password = String(required=True)
        captcha = String(required=True)

    user = Field(lambda: UserType)

    def mutate(self, info, username, email, password, captcha):
        if not verify_captcha(captcha):
            raise Exception("Invalid CAPTCHA. Please try again.")
        
        existing_user = UserModel.objects(username=username).first()
        if existing_user:
            raise Exception("Username already exists. Please choose another.")
        
        existing_user = UserModel.objects(email=email).first()
        if existing_user:
            raise Exception("Email already exists. Please choose another.")
        
        user = UserModel(
            username=username,
            email=email,
        )
        user.set_password(password)
        user.save()
        return CreateUser(user=user)
class DeleteUser(graphene.Mutation):
    class Arguments:
        user_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, user_id):
        try:
            user = UserModel.objects.get(id=user_id)
            user.delete()
            success = True
        except UserModel.DoesNotExist:
            success = False

        return DeleteUser(success=success)
class EditUser(graphene.Mutation):
    class Arguments:
        user_id = graphene.String(required=True)
        new_username = graphene.String()
        new_email = graphene.String()

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(self, info, user_id, new_username=None, new_email=None):
        error = None
        try:
            user = UserModel.objects.get(id=user_id)
            if new_username:
                usernameExists = UserModel.objects(username=new_username)
                if usernameExists and usernameExists.id == user_id:
                    error = 'Username is same as the current'
                elif usernameExists:
                    error = 'Username already exists'
                user.username = new_username
            if new_email:
                emailExists = UserModel.objects(email=new_email)
                if emailExists and emailExists.id == user_id:
                    error = 'Email is same as the current'
                elif emailExists:
                    error = 'Email already exists'
                user.email = new_email
            
            user.save()
            success = True
        except UserModel.DoesNotExist:
            print('asd')
            success = False

        return EditUser(success=success, error=error)
class Login(graphene.Mutation):
    class Arguments:
        username = String(required=True)
        password = String(required=True)

    token = String()
    success = Boolean()
    user = graphene.Field(lambda: UserType)

    def mutate(self, info, username, password):
        user = UserModel.objects(username=username).first()

        if not user or not user.check_password(password):
            raise Exception("Invalid username or password")
        load_dotenv()

        token = jwt.encode({'user_id': str(user.id)}, os.getenv('JWT_SECRET_KEY'), algorithm='HS256')
        
        return Login(token=token, success=True, user=user)
class RequestPasswordReset(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, email):
        user = UserModel.objects(email=email).first()
        if user:
            send_password_reset_email(user)
            success=True
        else:
            success=False
        return RequestPasswordReset(success=success)
class ResetPassword(graphene.Mutation):
    class Arguments:
        token = graphene.String(required=True)
        new_password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, token, new_password):
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=['HS256'])
            user_id = payload['reset_password']
            user = UserModel.objects.get(id=user_id)

            if not user:
                return ResetPassword(success=False, message="Invalid token")

            user.set_password(new_password)
            user.save()

            return ResetPassword(success=True, message="Password has been reset successfully")
        except jwt.ExpiredSignatureError:
            return ResetPassword(success=False, message="The reset token has expired")
        except jwt.InvalidTokenError:
            return ResetPassword(success=False, message="Invalid token")
class Query(graphene.ObjectType):
    all_users = graphene.List(UserType, limit=Int(), skip=Int())
    fetch_user = graphene.Field(UserType, user_id=graphene.String(required=True))
    search_users = graphene.List(UserType, query=String(required=True), limit=Int(), skip=Int())
    users_count = graphene.Int()
    search_users_count = graphene.Int(query=String(required=True))

    def resolve_all_users(self, info, limit=None, skip=None):
        query = UserModel.objects
        if skip:
            query = query.skip(skip)
        if limit:
            query = query.limit(limit)
        return list(query)
    
    def resolve_fetch_user(self, info, user_id):
        user = UserModel.objects(id=user_id).first()
        if not user:
            raise Exception(f"User with id {user_id} not found")
        return user
    def resolve_search_users(self, info, query, limit=None, skip=None):
        query_set =  UserModel.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        )
        if skip:
            query_set = query_set.skip(skip)
        if limit:
            query_set = query_set.limit(limit)
        return list(query_set)
        
    def resolve_users_count(self, info):
        return UserModel.objects.count()
    
    def resolve_search_users_count(self, info, query):
        query_set = UserModel.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        )
        return query_set.count()
class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    delete_user = DeleteUser.Field()
    edit_user = EditUser.Field()
    login = Login.Field()
    request_password_reset = RequestPasswordReset.Field()
    reset_password = ResetPassword.Field()