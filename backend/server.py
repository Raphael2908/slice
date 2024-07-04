from flask import Flask
from flask import request
from flask_cors import CORS
from flask import Response
import transcribe_audio
import json
import os
app = Flask(__name__)
cors = CORS(app)

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
def transcribe():
    # Get file uuid 
    # transcribe audio
    uuid = request.form.get('uuid', None)
    audioName = f"{uuid}.mp3" # Create name of audio file
    transcribe_audio.transcribe(audioName) # transcribe audio
    os.remove(audioName) # remove audio for saving space
    return Response('Video Transcribed')

@app.route("/api/transcription", methods=['GET'])
def get_transcription():
    uuid = request.args.get('uuid')
    # Reading dictionary from a text file
    with open(f'{uuid}.txt', 'r') as file:
        data = json.load(file)

    return data

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000, debug=True)