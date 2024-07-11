from celery import Celery  
import transcribe_audio
import os
import requests

celery_app = Celery('tasks', backend='rpc://', broker='pyamqp://')

@celery_app.task(bind=True)
def transcribe_task(self, uuid):
    audioName = f"{uuid}.mp3" # Create name of audio file
    transcribe_audio.transcribe(audioName) # transcribe audio
    os.remove(audioName) # remove audio for saving space
    requests.post('http://127.0.0.1:8000/api/transcription_done', json={'task_id': self.request.id})
    return 'Video Transcribed'