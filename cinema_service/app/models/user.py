from mongoengine import Document, StringField
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from email_validator import validate_email, EmailNotValidError
from mongoengine.errors import ValidationError

ph = PasswordHasher()

class UserModel(Document):
    meta = {'collection': 'users'}
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    password_hash = StringField(required=True)

    def set_password(self, password):
        self.password_hash = ph.hash(password)

    def check_password(self, password):
        try:
            return ph.verify(self.password_hash, password)
        except VerifyMismatchError:
            return False

    def clean(self):
        try:
            validate_email(self.email)
        except EmailNotValidError as e:
            raise ValidationError(f"Invalid email address: {str(e)}")