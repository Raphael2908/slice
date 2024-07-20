from whisper_jax import FlaxWhisperPipline
import jax.numpy as jnp
import time
import json

def transcribe(audio_name): 
    
    # audiName: uuid
    pipeline = FlaxWhisperPipline("openai/whisper-base.en", dtype=jnp.bfloat16, batch_size=16)
    start = time.time()
    result = pipeline(audio_name, language="English", task="transcribe", return_timestamps=True)
    end = time.time()
    print(start - end)

    output = {}

    for i in range(len(result['chunks'])): 
        output[i] = [result['chunks'][i]["text"], { "start" : result['chunks'][i]["timestamp"][0], "end": result['chunks'][i]["timestamp"][1]}]
    
    # Writing dictionary to a text file
    new_audio_name = audio_name.replace('.mp3', '')
    with open(f'{new_audio_name}.txt', 'w') as file:
        json.dump(output, file, indent=4)

    return output
