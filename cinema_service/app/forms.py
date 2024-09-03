from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectMultipleField, FieldList,FormField, SelectField,TimeField
from wtforms.validators import DataRequired, Email, NumberRange
from flask_wtf.file import FileRequired,FileAllowed
from wtforms import FileField
from .models.movie import MovieModel
from flask_wtf.recaptcha import RecaptchaField

class AddUserForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    captcha = RecaptchaField('Captcha', validators=[DataRequired()])
    submit = SubmitField('Add User')  
class AddMovieForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    duration = IntegerField('Duration', validators=[DataRequired(),NumberRange(min=0)])
    poster = FileField('Image', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'png'], 'Images only!')
    ])
    video_url = StringField('Video', validators=[DataRequired()])
    description = StringField('Description', validators=[DataRequired()])
    submit = SubmitField('Add Movie') 
class WorkingDayForm(FlaskForm):
    day = SelectField('Day', choices=[
        ("Monday", "Monday"), ("Tuesday", "Tuesday"), ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"), ("Friday", "Friday"), ("Saturday", "Saturday"), ("Sunday", "Sunday")
    ], validators=[DataRequired()])
    start_time = TimeField('Start Time', validators=[DataRequired()])
    end_time = TimeField('End Time', validators=[DataRequired()])
class SeatForm(FlaskForm):
    row = IntegerField('Row', validators=[DataRequired()])
    column = IntegerField('Column', validators=[DataRequired()])
    delete_seat = SubmitField('Delete Seat')
class SeatGroupForm(FlaskForm):
    group_name = StringField('Group Name', validators=[DataRequired()])
    rows = IntegerField('Rows', validators=[DataRequired(), NumberRange(min=1)])
    columns = IntegerField('Columns', validators=[DataRequired(), NumberRange(min=1)])
    seats = FieldList(FormField(SeatForm), min_entries=0)
    delete_group = SubmitField('Delete Group')
class AddCinemaForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    location = StringField('Location', validators=[DataRequired()])
    image = FileField('Image', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'png'], 'Images only!')
    ])
    working_days = FieldList(FormField(WorkingDayForm), min_entries=0)
    seat_groups = FieldList(FormField(SeatGroupForm), min_entries=0)
    add_group = SubmitField('Add Seat Group')
    submit = SubmitField('Add Cinema')
class AddAdminForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Add User')   
class ActorSearchForm(FlaskForm):
    query = StringField('Search Actors', validators=[DataRequired()])
    submit = SubmitField('Search')  
class AddActorForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    movies = SelectMultipleField(
        'Movies',
        choices=[],
        coerce=str
    )
    submit = SubmitField('Update Actor')
    
    def __init__(self, *args, **kwargs):
        selected_movies = kwargs.pop('selected_movies', [])
        super().__init__(*args, **kwargs)
        self.movies.choices = [(str(movie.id), movie.title) for movie in MovieModel.objects.all()]
        self.movies.data = selected_movies
