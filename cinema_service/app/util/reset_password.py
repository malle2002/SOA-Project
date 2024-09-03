import jwt
import datetime
from flask_mail import Message
from dotenv import load_dotenv
import os
from flask import current_app
from dotenv import load_dotenv

def generate_reset_token(user):
    load_dotenv()
    payload = {
        'reset_password': str(user.id),
        'exp': datetime.datetime.now() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, os.getenv('JWT_SECRET_KEY'), algorithm='HS256')
    return token

def send_password_reset_email(user):
    load_dotenv()
    token = generate_reset_token(user)
    reset_url = f"{os.getenv('NEXT_PUBLIC_BASE_URL')}/reset-password?token={token}"
    msg = Message(subject="Password Reset",
                  recipients=[user.email],
                  body=f'Click the link to reset your password: {reset_url}')
    with current_app.app_context():
        mail = current_app.extensions['mail']
        mail.send(msg)