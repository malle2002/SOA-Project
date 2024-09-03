from mongoengine import Document, StringField
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

class AdminUser(Document):
    meta = {'collection': 'admins'}
    username = StringField(required=True, unique=True)
    password = StringField(required=True)

    def set_password(self, password):
        self.password = ph.hash(password)

    def check_password(self, password):
        try:
            return ph.verify(self.password, password)
        except VerifyMismatchError:
            return False
