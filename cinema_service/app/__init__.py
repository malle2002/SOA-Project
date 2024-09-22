import logging
from flask import Flask, request, jsonify, redirect, render_template, url_for, session, flash
from flask_jwt_extended import JWTManager, verify_jwt_in_request, jwt_required, decode_token
from mongoengine import connect
from flask_session import Session
from flask_graphql import GraphQLView
from app.schemas import schema
from app.routes import cinemas_bp, movies_bp, users_bp, actors_bp
from datetime import datetime
from flask_cors import CORS
import cloudinary
import os
from dotenv import load_dotenv
from app.config import Config
from flask_mail import Mail
from app.forms import AddAdminForm
from flask_socketio import SocketIO, emit
from .util.scheduler import start_scheduler
from flask_wtf.csrf import CSRFProtect, validate_csrf
socketio = SocketIO()

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)
    socketio.init_app(app)
    mail = Mail(app)
    mail.init_app(app)
    csrf = CSRFProtect(app)
    CORS(app, resources={r"/*": {"origins": ["http://localhost"]}}, supports_credentials=True)
    jwt = JWTManager(app)
    Session(app)
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )
    
    MONGO_URI = os.environ.get('MONGO_URI')
    try:
        connect(db='cinemacollection',host=MONGO_URI, alias='default')
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
    
    @app.before_request
    def before_request():

        token = request.cookies.get('access_token_cookie')
        if token:
            request.headers.environ['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        if request.endpoint and request.endpoint != 'login' and 'Authorization' in request.headers:
            try:
                verify_jwt_in_request()
            except Exception as e:
                return redirect(url_for("login"))

    @app.context_processor
    def inject_current_url():
         return {'current_url': request.path}
    
    @app.route('/cinema-service/admin', methods=["GET"])
    @jwt_required()
    def admin_panel():
        token = request.cookies.get('access_token_cookie')
        if token:
            try:
                decoded_token = decode_token(token)
                expiration_time = datetime.fromtimestamp(decoded_token['exp'])
                current_time = datetime.now()
                if expiration_time < current_time:
                    return redirect('/cinema-service/login')
                else:
                    return render_template('admin.html')
            except:
                return redirect('/cinema-service/login')
        else:
            return redirect('/cinema-service/login')

    @app.route('/cinema-service/admin/add', methods=['GET','POST'])
    @jwt_required
    def admin_add():
        form = AddAdminForm()
        if form.validate_on_submit():
            username = form.username.data
            password = form.password.data

            mutation_query = f"""
                mutation {{
                    createAdmin(username: "{username}",  password: "{password}") {{
                        ok
                    }}
                }}
            """
            try:
                result = schema.execute(mutation_query)
                if result.errors:
                    print(result.errors)
                    flash('Failed to add admin.', 'error')
                else:
                    flash('Admin added successfully!', 'success')
                    return redirect(url_for('admin_add'))
            except Exception as e:
                flash(f'Error: {str(e)}', 'error')

        return render_template('/admin/add_admin.html', form=form)
    
    @app.route('/cinema-service/graphql', methods=['GET', 'POST', 'OPTIONS'])
    @csrf.exempt
    def graphql():
        if request.method == 'OPTIONS':
            response = jsonify({}) ##'https://cinemation-3.vercel.app'
            response.headers.add('Access-Control-Allow-Origin', "http://localhost")
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            view = GraphQLView.as_view('graphql', schema=schema)
            return view()

    @app.route('/cinema-service/login', methods=['GET', 'POST'])
    @csrf.exempt
    def login():
        if request.method == 'GET':
            return render_template("login.html")
        else:
            csrf_token = request.form.get('csrf_token')
        
            try:
                validate_csrf(csrf_token)
            except:
                return jsonify({"msg": "CSRF token is missing or invalid."}), 400
            
            username = request.form.get('username', None)
            password = request.form.get('password', None)

            query = '''
            mutation login($username: String!, $password: String!) {
                loginAdmin(username: $username, password: $password) {
                    ok
                    auth {
                        accessToken
                    }
                    message
                }
            }
            '''

            variables = {
                'username': username,
                'password': password
            }

            result = schema.execute(query, variables=variables)
            if result.errors:
                return jsonify({'errors': [str(error) for error in result.errors]}), 401

            data = result.data['loginAdmin']
            if data['ok']==True:
                access_token = data['auth']['accessToken']
                session['access_token'] = access_token
                response = redirect('/cinema-service/admin')
                response.set_cookie('access_token_cookie', access_token)
                return response
            else:
                return jsonify({"msg": data['message']}), 401
            
    app.register_blueprint(cinemas_bp)
    app.register_blueprint(movies_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(actors_bp)
    
    @app.route('/cinema-service/', defaults={'path': ''})
    @app.route('/cinema-service/<path:path>')
    def catch_all(path):
        return redirect(url_for('login'))
    
    start_scheduler() 
    
    return app, mail, socketio, csrf

@socketio.on('connect')
def handle_connect():
    emit('message', {'data': 'Connected to the server'})