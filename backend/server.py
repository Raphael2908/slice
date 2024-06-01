from flask import Flask
from flask import request
from flask_cors import CORS
import transcribe
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
        f = request.files.get('audio', None)
        uuid = request.form.get('uuid', None)
        print(request.files.get('audio', None))
        print(uuid)
        audioName = f"./temp-{uuid}" # Create name of audio file
        f.save(f"{audioName}.mp3")
        transcribe.transcribe(audioName) # transcribe audio
        os.remove(f"{audioName}.mp3") # remove audio for saving space
        return "Video transcribed"

@app.route("/api/transcription", methods=['GET'],)
def get_transcription():
    uuid = request.args.get('uuid')
    # Reading dictionary from a text file
    with open(f'temp-{uuid}.txt', 'r') as file:
        data = json.load(file)

    return data

if __name__ == "__main__":
    app.run(host='0.0.0.0')