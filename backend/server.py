from flask import Flask
from flask import request
from flask_cors import CORS
from flask import Response
from tasks import transcribe_task
import json
from flask_socketio import SocketIO

app = Flask(__name__)
cors = CORS(app)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:3000'])

@app.route("/")
def hello_world():
    response = "<h1>Hello from slice!</h1>"
    return response

@app.route("/api/upload", methods=['GET', 'POST'],)
def upload(): 
    # Get file with audio
    # Plug it into whisper
    # Return data
    if request.method == 'POST':
        # Get audio file and uuid from request
        chunk = request.files.get('chunk', None)
        uuid = request.form.get('uuid', None)
        chunkParams = json.loads(request.form.get('chunkParams'))
        chunk_id = chunkParams['chunkId']

        print(chunk)
        print(uuid)
        print(chunkParams)
        
        audio_filename = f"{uuid}.mp3"

        # handle main chunks first
        if(chunk_id != chunkParams['fullChunks']): 
            if(chunk_id == 0): 
                # create file
                with open(audio_filename, 'wb') as file:
                    file.write(chunk.read())
            else:
                # append chunks to file
                with open(audio_filename, 'ab') as file:
                    file.write(chunk.read())

            return Response('received Chunk', 202)

        # handle partial chunk at the end of file
        if(chunk_id == chunkParams['fullChunks']): 
            with open(audio_filename, 'ab') as file:
                    file.write(chunk.read())
            return Response('all chunks received', 200)
        

@app.route("/api/transcribe", methods=['POST'])
def handle_transcription():
    # Get file uuid 
    # call celery task to transcribe
    uuid = request.form.get('uuid', None)
    transcribe_task(uuid=uuid) # Celery Task
    return Response('Video being transcribed')

@app.route("/api/transcription", methods=['GET'])
def get_transcription():
    uuid = request.args.get('uuid')
    # Reading dictionary from a text file
    with open(f'{uuid}.txt', 'r') as file:
        data = json.load(file)

    return data

@socketio.on('my event')
def handle_my_custom_event(json):
    print('received json: ' + str(json))

if __name__ == "__main__":
    socketio.run(app, host='127.0.0.1', port=8000, debug=True)