FROM python:3.10-slim

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:4000"]