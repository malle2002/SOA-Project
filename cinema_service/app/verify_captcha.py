import requests

def verify_captcha(captcha_token):
    secret_key = '6Lc4Ow4qAAAAAFbHToGAUZ-y_YEM1_PuWiKTh5-z'
    
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': secret_key,
            'response': captcha_token,
        }
    )
    result = response.json()
    return result['success']