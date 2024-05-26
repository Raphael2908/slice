from flask import Flask
from flask import request
import flask
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app)

@app.route("/")
def hello_world():
    response = flask.jsonify({'some': 'data'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/upload", methods=['GET', 'POST'],)
def upload(): 
    # Get file with audio
    # Plug it into whisper
    # Return data
    if request.method == 'POST':
        f = request.files['file']
        f.save('/files')