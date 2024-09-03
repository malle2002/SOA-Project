from datetime import timedelta, datetime
from ..models.schedule import Schedule
from apscheduler.schedulers.background import BackgroundScheduler

def remove_expired_schedule_items():
    from app import socketio
    current_time = datetime.now()
    for schedule in Schedule.objects:
        for schedule_day in schedule.schedule_days:
            new_items = [
                item for item in schedule_day.schedule_items
                if current_time < item.start_time + timedelta(minutes=item.duration + 30)
            ]
            if len(new_items) != len(schedule_day.schedule_items):
                schedule_day.schedule_items = new_items
                schedule.save() 
                socketio.emit('schedule_update', {'cinema_id': schedule.cinema_id, 'schedule_days': schedule.schedule_days})


scheduler = BackgroundScheduler()
scheduler.add_job(remove_expired_schedule_items, 'interval', minutes=10)

def start_scheduler():
    scheduler.start()