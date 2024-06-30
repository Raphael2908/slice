import whisper
import json

def transcribe(audio_name): 
    
    # audiName: uuid
    model = whisper.load_model("base")
    result = model.transcribe(audio_name, language="English", word_timestamps=True)
    output = {}

    for i in range(len(result['segments'])): 
        output[i] = [result['segments'][i]["text"], { "start" : result['segments'][i]["start"], "end": result['segments'][i]["end"]}]
    
    # Writing dictionary to a text file
    new_audio_name = audio_name.replace('.mp3', '')
    with open(f'{new_audio_name}.txt', 'w') as file:
        json.dump(output, file, indent=4)

    return output
