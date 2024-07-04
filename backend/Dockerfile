FROM python:3

WORKDIR /usr/src/app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend /usr/src/app/

EXPOSE 5000

CMD gunicorn --bind 0.0.0.0:5000 wsgi:app