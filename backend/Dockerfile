FROM python:3.12

WORKDIR /usr/src/app

# Install FFmpeg for whisper
RUN apt-get update && \
    apt-get clean

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY ./ /usr/src/app/

CMD gunicorn --bind 0.0.0.0:8000 --worker-class eventlet -w 1 wsgi:app 
