from flask import Flask
from flask import request
import flask
from flask_cors import CORS
import transcribe
import json

app = Flask(__name__)
cors = CORS(app)

@app.route("/")
def hello_world():
    response = "<h1>Hello from slice!</h1>"
    return response

@app.route("/upload", methods=['GET', 'POST'],)
def upload(): 
    # Get file with audio
    # Plug it into whisper
    # Return data
    if request.method == 'POST':
        print(request.files.get('video', None))
        f = request.files.get('video', None)
        f.save("./temp.mp4")
        transcribe.transcribe()
        return "Video transcribed"

@app.route("/transcription", methods=['GET'],)
def get_transcription(): 
    # Reading dictionary from a text file
    with open('output.txt', 'r') as file:
        data = json.load(file)

    return data

if __name__ == "__main__":
    app.run(host='0.0.0.0')