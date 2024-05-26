import whisper
import ffmpeg
from moviepy.editor import *
import os
import json

def transcribe(): 
    video = VideoFileClip("temp.mp4")
    video.audio.write_audiofile("temp.mp3")
    os.remove("temp.mp4")
    model = whisper.load_model("base")
    result = model.transcribe("temp.mp3", language="English", word_timestamps=True)
    output = {}

    for i in range(len(result['segments'])): 
        output[i] = [result['segments'][i]["text"], { "start" : result['segments'][i]["start"], "end": result['segments'][i]["end"]}]
    # Writing dictionary to a text file
    with open('output.txt', 'w') as file:
        json.dump(output, file, indent=4)
    return output
