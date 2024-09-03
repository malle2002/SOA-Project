from graphene import Field,ObjectType,Boolean,String,Mutation,Schema
from graphene_mongo import MongoengineObjectType
from app.models.admin import AdminUser as AdminUserModel
from flask import session
from flask_jwt_extended import create_access_token

class AuthType(ObjectType):
    access_token = String()
    
class AdminUserType(MongoengineObjectType):
    class Meta:
        model = AdminUserModel

class LoginAdminMutation(Mutation):
    class Arguments:
        username = String(required=True)
        password = String(required=True)

    ok = Boolean()
    auth = Field(lambda: AuthType)
    message = String()
    adminUser = Field(lambda: AdminUserType)

    def mutate(root, info, username, password):

        admin_user = AdminUserModel.objects(username=username).first()
        
        if admin_user and admin_user.check_password(password):
            access_token = create_access_token(identity=username)
            session['access_token'] = access_token
            return LoginAdminMutation(
                ok=True,
                auth=AuthType(access_token=access_token),
                message="Login successful"
            )
        else:
            return LoginAdminMutation(ok=False, message="Bad username or password")
        
class CreateAdminMutation(Mutation):
    class Arguments:
        username = String(required=True)
        password = String(required=True)

    ok = Boolean()
    message = String()
    adminUser = Field(lambda: AdminUserType)

    def mutate(root, info, username, password):
        if AdminUserModel.objects(username=username).first():
            return CreateAdminMutation(ok=False, message="Username already exists")

        adminUser = AdminUserModel(username=username)
        adminUser.set_password(password)
        adminUser.save()
        return CreateAdminMutation(ok=True, message="Admin user created successfully")

class Mutation(ObjectType):
    login_admin = LoginAdminMutation.Field()
    create_admin = CreateAdminMutation.Field()