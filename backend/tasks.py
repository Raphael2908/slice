from celery import Celery  
import transcribe_audio
import os

celery_app = Celery('tasks', backend='rpc://', broker='pyamqp://')

@celery_app.task
def transcribe_task(uuid):
    audioName = f"{uuid}.mp3" # Create name of audio file
    transcribe_audio.transcribe(audioName) # transcribe audio
    os.remove(audioName) # remove audio for saving space
    return 'Video Transcribed'

@celery_app.task
def notify_client_of_transcription_status(): 
    # Websocket bs
    return None