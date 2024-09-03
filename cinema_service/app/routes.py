from flask import Blueprint, jsonify, flash, redirect, url_for, render_template, request
from flask_jwt_extended import jwt_required
import requests
from app.forms import AddUserForm, AddMovieForm, AddCinemaForm, AddActorForm, WorkingDayForm, SeatForm, SeatGroupForm
from .models.actor import ActorModel as Actor
from app.schemas import schema
import cloudinary
import cloudinary.api
import cloudinary.uploader
import os
from dotenv import load_dotenv
from math import ceil
from app.models.genre import GenreEnum
import json
from flask_wtf.csrf import validate_csrf
from datetime import datetime
from flask import current_app
from collections import defaultdict

users_bp = Blueprint('users', __name__, url_prefix='/admin/users')
movies_bp = Blueprint('movies', __name__, url_prefix='/admin/movies')
cinemas_bp = Blueprint('cinemas', __name__, url_prefix='/admin/cinemas')
actors_bp = Blueprint('actors', __name__, url_prefix='/admin/actors')

def format_seat(seat):
    return f'{{row: {seat["row"]}, column: {seat["column"]}, isTaken: {str(seat.get("isTaken", False)).lower()}}}'

def format_seat_group(seat_group):
    seats_str = ', '.join(format_seat(seat) for seat in seat_group['seats'])
    return f'{{groupName: "{seat_group["group_name"]}", rows: {seat_group["rows"]}, columns: {seat_group["columns"]}, seats: [{seats_str}]}}'

@users_bp.context_processor
def inject_current_url():
    return {'current_url': request.path}

@movies_bp.context_processor
def inject_current_url():
    return {'current_url': request.path}

@cinemas_bp.context_processor
def inject_current_url():
    return {'current_url': request.path}

@actors_bp.context_processor
def inject_current_url():
    return {'current_url': request.path}

@users_bp.route('', methods=['GET'])
@jwt_required()
def view_users():
    page = request.args.get('page', default=1, type=int)
    items_per_page = 10
    skip = (page - 1) * items_per_page
    substring = request.args.get('substring')
    if substring is None or len(substring) < 1:
        query = '''
        {
            allUsers(skip: %d, limit: %d) {
                id
                username
                email
            }
        }
        ''' % (skip, items_per_page)
        result = schema.execute(query)
        
        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
        users = result.data['allUsers']
    else:
        query = '''
        { 
            searchUsers(query: "%s",skip: %d, limit: %d) {
                id
                username
                email
            }
        }
        ''' % (substring, skip, items_per_page)
        result = schema.execute(query)
        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
        users = result.data['searchUsers']
        
    total_users = get_total_users_count(substring)
    total_pages = ceil(total_users / items_per_page) 

    if total_users>0 and page>total_pages or page<0:
        return redirect(url_for("users.view_users"))
    pagination = {
        'current_page': page,
        'total_pages': total_pages
    }

    users = result.data['allUsers'] if substring is None else result.data['searchUsers']
    
    return render_template('/users/users.html', users=users, pagination=pagination)
def get_total_users_count(substring=None):
    if substring is None:
        query = '{ usersCount }'
    else:
        query = '{ searchUsersCount(query: "%s") }' % substring
    result = schema.execute(query)
    if result.errors:
        return 0
    return result.data['usersCount'] if substring is None else result.data['searchUsersCount']

@users_bp.route('/add', methods=['POST','GET'])
@jwt_required()
def add_user():
    form = AddUserForm()
    if form.validate_on_submit():
        username = form.username.data
        email = form.email.data
        password = form.password.data
        
        captcha_response = form.captcha.data

        captcha_verify_url = "https://www.google.com/recaptcha/api/siteverify"
        captcha_secret_key = current_app.config['RECAPTCHA_PUBLIC_KEY']
        payload = {
            'secret': captcha_secret_key,
            'response': captcha_response
        }
        captcha_verification = requests.post(captcha_verify_url, data=payload)
        captcha_result = captcha_verification.json()

        if not captcha_result.get("success"):
            flash('Invalid CAPTCHA. Please try again.', 'error')
            return render_template('/users/add_user.html', form=form)

        mutation_query = f"""
            mutation {{
                createUser(username: "{username}", email: "{email}", password: "{password}") {{
                    user {{
                        id
                        username
                        email
                    }}
                }}
            }}
        """
        try:
            result = schema.execute(mutation_query)
            if result.errors:
                print(result.errors)
                flash('Failed to add user.', 'error')
            else:
                flash('User added successfully!', 'success')
                return redirect(url_for('users.view_users'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')

    return render_template('/users/add_user.html', form=form, key=current_app.config['RECAPTCHA_PUBLIC_KEY'])

@users_bp.route('/<id>/delete', methods=['POST'])
@jwt_required()
def delete_user(id):
    csrf_token = request.form.get('csrf_token')
    try:
        validate_csrf(csrf_token)
    except:
        return jsonify({"msg": "CSRF token is missing or invalid."}), 400
    user_id = id
    mutation = '''
        mutation {
            deleteUser(userId: "%s") {
                success
            }
        }
    ''' % user_id
    
    result = schema.execute(mutation)

    if result.errors:
        errors = [str(e) for e in result.errors]
        return jsonify({'errors': errors}), 400
    
    return redirect(url_for('users.view_users'))

@users_bp.route('/<id>/edit', methods=['POST','GET'])
@jwt_required()
def edit_user(id):
    if request.method == 'GET':
        query = '''
            query {
                fetchUser(userId: "%s") {
                    id
                    username
                    email
                }
            }
        ''' % id
        user = schema.execute(query)
        if user.errors:
            raise Exception(f"Failed to fetch user with id {id}")
        if not user:
            return jsonify({"msg": "User not found"}), 404
        user_data = user.data.get('fetchUser')
        form = AddUserForm()
        form.username = user_data.get('username')
        form.email = user_data.get('email')
        form.password = user_data.get('password')
        return render_template('/users/edit_user.html', form=form)
    
    elif request.method == 'POST':
        new_username = request.form.get('username')
        new_email = request.form.get('email')

        mutation = '''
            mutation {
                editUser(userId: "%s", newUsername: "%s", newEmail: "%s") {
                    success
                }
            }
        ''' % (id, new_username, new_email)

        result = schema.execute(mutation)

        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
        response = result.data['editUser']
        if response['success']:
            return redirect('/admin/users')
        else:
            return jsonify({"msg": "Failed to update user"}), 500

@movies_bp.route('', methods=['GET'])
@jwt_required()
def view_movies():
    page = request.args.get('page', default=1, type=int)
    items_per_page = 10
    skip = (page - 1) * items_per_page
    substring = request.args.get('substring')
    
    if substring is None or len(substring) < 1:
        query = '''
        {
            allMoviesPage(skip: %d, limit: %d) {
                id
                title
                genres
                duration
            }
        }
        ''' % (skip, items_per_page)
    else:
        query = '''
        {
            searchMoviesPage(query: "%s", skip: %d, limit: %d) {
                id
                title
                genres
                duration
            }
        }
        ''' % (substring, skip, items_per_page)
        
    result = schema.execute(query) 

    if result.errors:
        errors = [str(e) for e in result.errors]
        return jsonify({'errors': errors}), 400
    
    total_movies = get_total_movie_count(substring)
    total_pages = ceil(total_movies / items_per_page) 
    if total_movies>0 and page>total_pages or page<0:
        return redirect(url_for("movies.view_movies"))
    pagination = {
        'current_page': page,
        'total_pages': total_pages
    }

    movies = result.data['allMoviesPage'] if substring is None else result.data['searchMoviesPage']

    return render_template('/movies/movies.html', movies=movies, pagination=pagination)

def get_total_movie_count(substring=None):
    if substring is None:
        query = '{ movieCount }'
    else:
        query = '{ searchMovieCount(query: "%s") }' % substring
    result = schema.execute(query)
    if result.errors:
        return 0
    return result.data['movieCount'] if substring is None else result.data['searchMovieCount']

@movies_bp.route('/add', methods=['POST','GET'])
@jwt_required()
def add_movie():
    form = AddMovieForm()
    if form.validate_on_submit():
        title = form.title.data
        description = form.description.data
        genres = request.form.getlist('genres')
        genres = genres[0].split(',')
        genres = json.dumps(genres)
        duration = form.duration.data
        poster_file = form.poster.data
        video_url = form.video_url.data
        actor_ids = request.form.getlist('actors')
        
        load_dotenv()
        cloudinary.config(
            cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
            api_key=os.environ.get('CLOUDINARY_API_KEY'),
            api_secret=os.environ.get('CLOUDINARY_API_SECRET')
        )
        
        if poster_file:
            upload_result = cloudinary.uploader.upload(poster_file)
            poster_url = upload_result['secure_url']
        else:
            poster_url = None
        mutation_query = f"""
            mutation {{
                createMovie(
                    title: "{title}",
                    genres: {genres},
                    duration: {duration},
                    posterUrl: "{poster_url}",
                    videoUrl: "{video_url}",
                    description: "{description}",
                    actorIds: {json.dumps(actor_ids)}
                ) {{
                    movie {{
                        id
                        title
                        genres
                        duration
                        posterUrl
                        videoUrl
                        description
                        actors {{
                            id
                            name
                        }}
                    }}
                }}
            }}
        """
        try:
            result = schema.execute(mutation_query)
            if result.errors:
                print(result.errors)
                flash('Failed to add movie.', 'error')
            else:
                flash('Movie added successfully!', 'success')
                return redirect(url_for('movies.view_movies'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
    actors = Actor.objects
    return render_template('/movies/add_movie.html', form=form, genres=list(GenreEnum), actors=actors)
@movies_bp.route('/<id>/delete', methods=['POST'])
@jwt_required()
def delete_movie(id):
    csrf_token = request.form.get('csrf_token')
    try:
        validate_csrf(csrf_token)
    except:
        return jsonify({"msg": "CSRF token is missing or invalid."}), 400
    mutation_query = f"""
        mutation {{
            deleteMovie(movieId: "{id}") {{
                success
            }}
        }}
    """
    
    try:
        result = schema.execute(mutation_query)
        if result.errors:
            raise Exception(result.errors)
        success = result.data.get('deleteMovie', {}).get('success', False)
        if success:
            return redirect(url_for('movies.view_movies'))
        else:
            return jsonify({"msg": f"Failed to delete movie with ID {id}."}), 500
    except Exception as e:
        return jsonify({"msg": f"Error deleting movie: {str(e)}"}), 500

@movies_bp.route('/<id>/edit', methods=['POST','GET'])
@jwt_required()
def edit_movie(id):
    if request.method == 'GET':
        query = '''
            query {
                fetchMovie(movieId: "%s") {
                    id
                    title
                    genres
                    duration
                    posterUrl
                    videoUrl
                    description
                    actors {
                        id
                        name
                    }
                }
            }
        ''' % id
        movie = schema.execute(query)
        if movie.errors:
            raise Exception(f"Failed to fetch movie with id {id}")
        if not movie:
            return jsonify({"msg": "Movie not found"}), 404
        movie_data = movie.data.get('fetchMovie')
        form = AddMovieForm()
        form.title = movie_data.get('title')
        form.description = movie_data.get('description')
        form.duration = movie_data.get('duration')
        form.video_url = movie_data.get('videoUrl')
        selected_genres = [genre.name for genre in GenreEnum if genre.value in movie_data['genres']]
        context = {"form":form,"poster_url":movie_data.get("posterUrl"),"sel_genres":selected_genres,"genres":list(GenreEnum),"actors":Actor.objects}
        return render_template('/movies/edit_movie.html', context=context)
    elif request.method == 'POST':
        new_title = request.form.get('title')
        new_genres = request.form.getlist('genres')
        new_genres = new_genres[0]
        new_genres = new_genres.strip("[]")
        new_genres = new_genres.strip("'")
        new_genres = new_genres.strip("[]'")
        new_genres = new_genres.split(',')
        new_genres = json.dumps(new_genres)
        new_duration = request.form.get('duration')
        new_poster = request.files.get('poster')
        new_video_url = request.form.get('video_url')
        new_description = request.form.get('description')
        new_actor_ids = request.form.getlist('actors')
        new_actor_ids_json = json.dumps(new_actor_ids)
        
        query = '''
            query {
                fetchMovie(movieId: "%s") {
                    posterUrl
                }
            }
        ''' % id
        movie = schema.execute(query)
        if movie.errors:
            raise Exception(f"Failed to fetch movie with id {id}")
        movie_data = movie.data.get('fetchMovie')
        current_poster_url = movie_data.get('posterUrl')
        
        load_dotenv()
        cloudinary.config(
            cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
            api_key=os.environ.get('CLOUDINARY_API_KEY'),
            api_secret=os.environ.get('CLOUDINARY_API_SECRET')
        )
        
        if new_poster.filename and current_poster_url:
            public_id = current_poster_url.split('/')[-1].split('.')[0]
            cloudinary.uploader.destroy(public_id)
 
        new_poster_url = current_poster_url
        if new_poster.filename:
            upload_result = cloudinary.uploader.upload(new_poster)
            new_poster_url = upload_result['secure_url']
        mutation = '''
            mutation {
                editMovie(movieId: "%s", newTitle: "%s", newGenres: %s, newDuration: %s, newPosterUrl: "%s", newVideoUrl: "%s", newDescription: "%s", newActorIds: %s) {
                    success
                }
            }
        ''' % (id, new_title, new_genres, new_duration, new_poster_url, new_video_url, new_description, new_actor_ids_json)
        result = schema.execute(mutation)
        

        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
        response = result.data['editMovie']
        if response['success']:
            return redirect('/admin/movies')
        else:
            return jsonify({"msg": "Failed to update movie"}), 500

@cinemas_bp.route('', methods=['GET'])
@jwt_required()
def view_cinemas():
    page = request.args.get('page', default=1, type=int)
    items_per_page = 10
    skip = (page - 1) * items_per_page
    substring = request.args.get('substring')
    
    if substring is None or len(substring) < 1:
        query = '''
        {
            allCinemas(skip: %d, limit: %d) {
                id
                name
                location
            }
        }
        ''' % (skip, items_per_page)
    else:
        query = '''
        {
            searchCinemas(query: "%s", skip: %d, limit: %d) {
                id
                name
                location
            }
        }
        ''' % (substring, skip, items_per_page)  
        
    result = schema.execute(query)  
    if result.errors:
        errors = [str(e) for e in result.errors]
        return jsonify({'errors': errors}), 400  
    
    total_movies = get_total_cinema_count(substring)
    total_pages = ceil(total_movies / items_per_page) 

    if total_movies>0 and page>total_pages or page<0:
        return redirect(url_for("cinemas.view_cinemas"))
    
    pagination = {
        'current_page': page,
        'total_pages': total_pages
    }

    cinemas = result.data['allCinemas'] if substring is None else result.data['searchCinemas']

    return render_template('/cinemas/cinemas.html', cinemas=cinemas, pagination=pagination)   
 
def get_total_cinema_count(substring=None):
    if substring is None:
        query = '{ cinemaCount }'
    else:
        query = '{ searchCinemaCount(query: "%s") }' % substring
    result = schema.execute(query)
    if result.errors:
        return 0
    return result.data['cinemaCount'] if substring is None else result.data['searchCinemaCount']

@cinemas_bp.route('/add', methods=['GET','POST'])
@jwt_required()
def add_cinema():
    form = AddCinemaForm()
    if form.validate_on_submit():
        name = form.name.data
        location = form.location.data
        image_file = form.image.data
        
        days = []
        start_times = []
        end_times = []
        working_days_data = []
        for key, value in request.form.items():
            if key.endswith('-day'):
                index = key.split('-')[1]
                days.append((index, value))
            elif key.endswith('-start_time'):
                index = key.split('-')[1]
                start_times.append((index, value))
            elif key.endswith('-end_time'):
                index = key.split('-')[1]
                end_times.append((index, value))

        days.sort(key=lambda x: int(x[0]))
        start_times.sort(key=lambda x: int(x[0]))
        end_times.sort(key=lambda x: int(x[0]))

        for i in range(len(days)):
            working_days_data.append({
                'day': days[i],
                'start_time': start_times[i],
                'end_time': end_times[i]
            })
        working_days_str = ', '.join([f"{{day: \"{wd['day']}\", startTime: \"{wd['start_time']}\", endTime: \"{wd['end_time']}\"}}" for wd in working_days_data])

        seat_groups_data = defaultdict(lambda: {'rows': 0, 'columns': 0, 'seats': []})
        for key, value in request.form.items():
            if key.startswith('seat_groups-'):
                parts = key.split('-')
                group_id = parts[1]
                field_type = parts[2]

                if field_type == 'group_name':
                    seat_groups_data[group_id]['group_name'] = value
                elif field_type == 'rows':
                    seat_groups_data[group_id]['rows'] = int(value)
                elif field_type == 'columns':
                    seat_groups_data[group_id]['columns'] = int(value)
                else:
                    seat_row = parts[2]
                    seat_column = parts[3]
                    
                    row_value = request.form.get(f'seat_groups-{group_id}-{seat_row}-{seat_column}-row')
                    column_value = request.form.get(f'seat_groups-{group_id}-{seat_row}-{seat_column}-column')
                    
                    existing_seat = next((seat for seat in seat_groups_data[group_id]['seats'] if seat['row'] == row_value and seat['column'] == column_value), None)
                    if not existing_seat:
                        seat_groups_data[group_id]['seats'].append({
                            'row': row_value,
                            'column': column_value,
                            'is_taken': False
                        })
        seat_groups_data = dict(seat_groups_data)
        seat_groups_str = ', '.join(format_seat_group(sg) for sg in seat_groups_data.values())
        
        load_dotenv()
        cloudinary.config(
            cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
            api_key=os.environ.get('CLOUDINARY_API_KEY'),
            api_secret=os.environ.get('CLOUDINARY_API_SECRET')
        )
        
        if image_file:
            upload_result = cloudinary.uploader.upload(image_file)
            imageUrl = upload_result['secure_url']
        else:
            imageUrl = None

        mutation_query = f"""
            mutation {{
                createCinema(name: "{name}", location: "{location}", imageUrl: "{imageUrl}", workingDays: [{working_days_str}], seatGroups: [{seat_groups_str}]) {{
                    cinema {{
                        id
                        name
                        location
                        imageUrl
                        workingDays {{
                            day
                            startTime
                            endTime
                        }}
                        seatGroups {{
                            groupName
                            rows
                            columns
                            seats {{
                                row
                                column
                                isTaken
                            }}
                        }}
                    }}
                }}
            }}
        """
        try:
            result = schema.execute(mutation_query)
            if result.errors:
                print(result.errors)
                flash('Failed to add cinema.', 'error')
            else:
                flash('Cinema added successfully!', 'success')
                return redirect(url_for('cinemas.view_cinemas'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
    else:
        print(form.errors)
    return render_template('/cinemas/add_cinema.html', form=form)

@cinemas_bp.route('/<id>/delete', methods=['POST'])
@jwt_required()
def delete_cinema(id):
    csrf_token = request.form.get('csrf_token')
    try:
        validate_csrf(csrf_token)
    except:
        return jsonify({"msg": "CSRF token is missing or invalid."}), 400
    mutation_query = f"""
        mutation {{
            deleteCinema(cinemaId: "{id}") {{
                success
            }}
        }}
    """
    
    try:
        result = schema.execute(mutation_query)
        if result.errors:
            raise Exception(result.errors)
        success = result.data.get('deleteCinema', {}).get('success', False)
        if success:
            return redirect(url_for('cinemas.view_cinemas'))
        else:
            return jsonify({"msg": f"Failed to delete cinema with ID {id}."}), 500
    except Exception as e:
        return jsonify({"msg": f"Error deleting cinema: {str(e)}"}), 500

@cinemas_bp.route('/<id>/edit', methods=['POST','GET'])
@jwt_required()
def edit_cinema(id):
    if request.method == 'GET':
        query = '''
            query {
                fetchCinema(cinemaId: "%s") {
                    id
                    name
                    location
                    imageUrl
                    workingDays {
                        day
                        startTime
                        endTime
                    }
                    seatGroups {
                        groupName
                        rows
                        columns
                        seats {
                            row
                            column
                            isTaken
                        }
                    }
                }
            }
        ''' % id
        cinema = schema.execute(query)
        if cinema.errors:
            raise Exception(f"Failed to fetch cinema with id {id}")
        if not cinema:
            return jsonify({"msg": "Cinema not found"}), 404
        cinema_data = cinema.data.get('fetchCinema')
        form = AddCinemaForm()
        form.name = cinema_data.get('name')
        form.location = cinema_data.get('location')
        
        if len(cinema_data.get('workingDays')) > 0:
            for wd in cinema_data.get('workingDays'):
                day_form = WorkingDayForm()
                day_form.day = wd['day']
                day_form.start_time = datetime.strptime(wd['startTime'], '%H:%M').time()
                day_form.end_time = datetime.strptime(wd['endTime'], '%H:%M').time()
                form.working_days.append_entry(day_form)
                
        if cinema_data.get('seatGroups'):
            for sg in cinema_data.get('seatGroups'):
                seat_group_form = SeatGroupForm()
                seat_group_form.group_name.data = sg['groupName']
                seat_group_form.rows.data = sg['rows']
                seat_group_form.columns.data = sg['columns']
                for seat in sg['seats']:
                    seat_form = SeatForm()
                    seat_form.row.data = seat['row']
                    seat_form.column.data = seat['column']
                    seat_group_form.seats.append_entry(seat_form.data)
                form.seat_groups.append_entry(seat_group_form.data)
        context = {"form":form,"image_url":cinema_data.get("imageUrl")}
        return render_template('/cinemas/edit_cinema.html', context=context)
    elif request.method == 'POST':
        new_name = request.form.get('name')
        new_location = request.form.get('location')
        new_image = request.files.get('image')
        
        days = []
        start_times = []
        end_times = []
        working_days_data = []
        for key, value in request.form.items():
            if key.endswith('-day'):
                index = key.split('-')[1]
                days.append((index, value))
            elif key.endswith('-start_time'):
                index = key.split('-')[1]
                start_times.append((index, value))
            elif key.endswith('-end_time'):
                index = key.split('-')[1]
                end_times.append((index, value))

        days.sort(key=lambda x: int(x[0]))
        start_times.sort(key=lambda x: int(x[0]))
        end_times.sort(key=lambda x: int(x[0]))

        for i in range(len(days)):
            working_days_data.append({
                'day': days[i],
                'start_time': start_times[i],
                'end_time': end_times[i]
            })
        
        seat_groups_data = defaultdict(lambda: {'rows': 0, 'columns': 0, 'seats': []})
        for key, value in request.form.items():
            if key.startswith('seat_groups-'):
                parts = key.split('-')
                group_id = parts[1]
                field_type = parts[2]

                if field_type == 'group_name':
                    seat_groups_data[group_id]['group_name'] = value
                elif field_type == 'rows':
                    seat_groups_data[group_id]['rows'] = int(value)
                elif field_type == 'columns':
                    seat_groups_data[group_id]['columns'] = int(value)
                else:
                    seat_row = parts[2]
                    seat_column = parts[3]
                    
                    row_value = request.form.get(f'seat_groups-{group_id}-{seat_row}-{seat_column}-row')
                    column_value = request.form.get(f'seat_groups-{group_id}-{seat_row}-{seat_column}-column')
                    
                    existing_seat = next((seat for seat in seat_groups_data[group_id]['seats'] if seat['row'] == row_value and seat['column'] == column_value), None)
                    if not existing_seat:
                        seat_groups_data[group_id]['seats'].append({
                            'row': row_value,
                            'column': column_value,
                            'is_taken': False
                        })        
        seat_groups_data = dict(seat_groups_data)
        
        query = '''
            query {
                fetchCinema(cinemaId: "%s") {
                    imageUrl
                }
            }
        ''' % id
        cinema = schema.execute(query)
        if cinema.errors:
            raise Exception(f"Failed to fetch cinema with id {id}")
        cinema_data = cinema.data.get('fetchCinema')
        current_image_url = cinema_data.get('imageUrl')
        
        load_dotenv()
        cloudinary.config(
            cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
            api_key=os.environ.get('CLOUDINARY_API_KEY'),
            api_secret=os.environ.get('CLOUDINARY_API_SECRET')
        )
        
        if new_image.filename and current_image_url:
            public_id = current_image_url.split('/')[-1].split('.')[0]
            cloudinary.uploader.destroy(public_id)
            
        new_image_url = current_image_url
        if new_image.filename:
            upload_result = cloudinary.uploader.upload(new_image)
            new_image_url = upload_result['secure_url']
            
        working_days_str = ', '.join([f"{{day: \"{wd['day']}\", startTime: \"{wd['start_time']}\", endTime: \"{wd['end_time']}\"}}" for wd in working_days_data])
        seat_groups_str = ', '.join(format_seat_group(sg) for sg in seat_groups_data.values())
        mutation = '''
            mutation {
                editCinema(cinemaId: "%s", newName: "%s", newLocation: "%s", newImageurl: "%s", newWorkingDays: [%s], newSeatGroups: [%s]) {
                    success
                }
            }
        ''' % (id, new_name, new_location, new_image_url, working_days_str, seat_groups_str)

        result = schema.execute(mutation)

        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
        response = result.data['editCinema']
        if response['success']:
            return redirect('/admin/cinemas')
        else:
            return jsonify({"msg": "Failed to update cinema"}), 500

@cinemas_bp.route('/<cinema_id>/schedule', methods=['GET', 'POST'])
@jwt_required()
def schedule(cinema_id):
    if request.method == 'POST':
        csrf_token = request.form.get('csrf_token')
        
        try:
            validate_csrf(csrf_token)
        except:
            return jsonify({"msg": "CSRF token is missing or invalid."}), 400
        
        mutation_query = '''
        mutation addScheduleItem($scheduleDay: String!, $movieId: String!, $startTime: String!, $duration: Int!, $cinemaId: String!, $price: Int!) {
            addScheduleItem(scheduleDay: $scheduleDay, movieId: $movieId, startTime: $startTime, duration: $duration, cinemaId: $cinemaId, price: $price) {
                ok
                message
            }
        }
        '''
        variables = {
            'scheduleDay': request.form['schedule_day'],
            'movieId': request.form['movie_id'],
            'startTime': request.form['start_time'],
            'duration': int(request.form['duration']),
            'cinemaId': cinema_id,
            'price': request.form['price']
        }
        result = schema.execute(mutation_query, variables=variables)
        message = ''
        if result.data:
            add_schedule_item_result = result.data.get('addScheduleItem')
            if add_schedule_item_result:
                message = add_schedule_item_result.get('message', 'Unknown error')
                if add_schedule_item_result.get('ok'):
                    flash(message, 'success')
                else:
                    flash('Error: ' + message, 'error')
            else:
                message = 'Unexpected GraphQL result format'
                flash(message, 'error')
        else:
            message = 'No data returned from GraphQL'
            flash(message, 'error')
        
        return redirect(url_for('cinemas.schedule', cinema_id=cinema_id, message=message))
    message = request.args.get('message', '')
    query = '''
    query getSchedules($cinema_id: String!) {
        schedules(cinemaId: $cinema_id) {
            scheduleDays {
                day
                scheduleItems {
                    movieId
                    startTime
                    duration
                    price
                }
            }
        }
    }
    '''
    
    variables = {'cinema_id': cinema_id}
    result = schema.execute(query, variables=variables)
    
    schedule_data = result.data['schedules'] if result.data else None

    return render_template('schedule.html', cinema_id=cinema_id, schedule_data=schedule_data, message=message)
       
@actors_bp.route('/add', methods=['GET','POST'])
@jwt_required()
def add_actor():    
    form = AddActorForm()
    if form.validate_on_submit():
        name = form.name.data
        movie_ids = form.movies.data
        movie_ids_json = json.dumps(movie_ids)
        mutation_query = f"""
            mutation {{
                createActor(name: "{name}", movieIds: {movie_ids_json}) {{
                    actor {{
                        id
                        name
                        movies {{
                            id
                        }}
                    }}
                }}
            }}
        """
        try:
            result = schema.execute(mutation_query)
            if result.errors:
                print(result.errors)
                flash('Failed to add actor.', 'error')
            else:
                flash('Actor added successfully!', 'success')
                return redirect(url_for('actors.view_actors'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
    return render_template('/actors/add_actor.html', form=form)

@actors_bp.route('', methods=['GET'])
@jwt_required()
def view_actors():
    page = request.args.get('page', default=1, type=int)
    items_per_page = 10
    skip = (page - 1) * items_per_page
    substring = request.args.get('substring')
    if substring is None or len(substring) < 1:
        query = '''
        {
            allActors(skip: %d, limit: %d) {
                id
                name
            }
        }
        ''' % (skip, items_per_page)
        result = schema.execute(query)
        
        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
    else:
        query = '''
        { 
            allActors(query: "%s",skip: %d, limit: %d) {
                id
                name
            }
        }
        ''' % (substring, skip, items_per_page)
        result = schema.execute(query)
        if result.errors:
            errors = [str(e) for e in result.errors]
            return jsonify({'errors': errors}), 400
        
    actors = result.data['allActors']
        
    total_actors = get_total_actors_count(substring)
    total_pages = ceil(total_actors / items_per_page) 

    if total_actors>0 and page>total_pages or page<0:
        return redirect(url_for("actors.view_actors"))
    pagination = {
        'current_page': page,
        'total_pages': total_pages
    }

    actors = result.data['allActors']
    
    return render_template('/actors/actors.html', actors=actors, pagination=pagination)

def get_total_actors_count(substring=None):
    if substring is None:
        query = '{ actorsCount }'
    else:
        query = '{ searchActorsCount(query: "%s") }' % substring
    result = schema.execute(query)
    if result.errors:
        return 0
    return result.data['actorsCount'] if substring is None else result.data['searchActorsCount']

@actors_bp.route('/<id>/delete', methods=['POST'])
@jwt_required()
def delete_actor(id):
    mutation_query = f"""
        mutation {{
            deleteActor(actorId: "{id}") {{
                success
            }}
        }}
    """
    
    try:
        result = schema.execute(mutation_query)
        if result.errors:
            raise Exception(result.errors)
        success = result.data.get('deleteActor', {}).get('success', False)
        if success:
            return redirect(url_for('actors.view_actors'))
        else:
            return jsonify({"msg": f"Failed to delete actor with ID {id}."}), 500
    except Exception as e:
        return jsonify({"msg": f"Error deleting actor: {str(e)}"}), 500
    
@actors_bp.route('/<id>/edit', methods=['POST','GET'])
@jwt_required()
def edit_actor(id):
    if request.method == 'GET':
        query = '''
            query {
                fetchActor(actorId: "%s") {
                    id
                    name
                    movies {
                        id
                    }
                }
            }
        ''' % id
        actor = schema.execute(query)
        if actor.errors:
            raise Exception(f"Failed to fetch actor with id {id}")
        if not actors_bp:
            return jsonify({"msg": "Actor not found"}), 404
        actor_data = actor.data.get('fetchActor')
        
        movies = [movie['id'] for movie in actor_data.get('movies')]
        selected_movies = [str(movie['id']) for movie in actor_data.get('movies')]
        form = AddActorForm(selected_movies=selected_movies)
        form.name = actor_data.get('name')
        return render_template('/actors/edit_actor.html', form=form, movies=movies)
    elif request.method == 'POST':
        form = AddActorForm() 
        name = form.name.data
        movie_ids = form.movies.data
        movie_ids_json = json.dumps(movie_ids)
        
        mutation_query = f"""
                mutation {{
                    editActor(actorId: "{id}", name: "{name}", movieIds: {movie_ids_json}) {{
                        actor {{
                            id
                            name
                            movies {{
                                id
                            }}
                        }}
                    }}
                }}
            """
        actor = schema.execute(mutation_query)
        if actor.errors:
            raise Exception(f"Failed to fetch actor with id {id}")
        actor_data = actor.data.get('editActor')
          
        response = actor.data['editActor']
        if response['actor']:
            return redirect('/admin/actors')
        else:
            return jsonify({"msg": "Failed to update actor"}), 500