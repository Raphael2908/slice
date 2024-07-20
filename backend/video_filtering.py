from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import math

load_dotenv()

OPENAI_TEST_KEY = os.getenv('OPENAI_TEST_KEY')
OPENAI_SLICE_PROJECT_ID = os.getenv('OPENAI_SLICE_PROJECT_ID')
OPENAI_ORG_ID = os.getenv('OPENAI_ORG_ID')

client = OpenAI(api_key=OPENAI_TEST_KEY)

def handle_chunking_text(filename: str) -> list: 
    chunked_text = []
    # Read in text data from file
    f = open(filename, 'rt')
    data = f.read()
    text_dictionary = json.loads(data)

    chunk_size = 256 # 256 indexes

    chunks = math.floor(len(text_dictionary.keys()) / chunk_size)
    partial_chunk_size = len(text_dictionary.keys()) % chunk_size
    large_text = list(text_dictionary.values())

    # Add chunks of text to list
    for i in range(chunks):
        offset = i * chunk_size
        chunk_text = large_text[offset: (chunk_size + offset)]
        chunked_text.append(chunk_text)
    
    # Add partial chunks
    partial_chunk_end = len(text_dictionary.keys()) - partial_chunk_size
    partial_chunk = large_text[partial_chunk_end:]
    chunked_text.append(partial_chunk)
    print('Texts have been chunked')
    return chunked_text

def gpt_api_call(transcription_text: list):
    transcription_text
    result_string = ' '.join(
        f"[{sublist[0].strip()} {{start: {sublist[1]['start']}, end: {sublist[1]['end']}}}]"
        for sublist in transcription_text
    )
    response = client.chat.completions.create(
    model="gpt-3.5-turbo-0125",
    messages=[
        {
        "role": "system",
        "content": [
            {
            "text": "You are to analyse a long video transcript and pick out the best sections of the transcript for a student. \n\nEach section must be a minimum of 5mins long and have a title based on your summary of the section\n\nYour output must follow the format of: {Timestamp: Title} \n\n",
            "type": "text"
            }
        ]
        },
        {
        "role": "user",
        "content": [
            {
            "text": result_string,
            "type": "text"
            }
        ]
        },
        {
        "role": "assistant",
        "content": [
            {
            "text": "{159.52: Using React Native to Interface with Other Platforms}\n{241.68: Why APIs are Essential for Accessing Data}\n{676.36: Building a Reddit Client Using APIs}",
            "type": "text"
            }
        ]
        }
    ],
    temperature=0.1,
    max_tokens=256,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0
    )
    return response

def create_timestamps(chunked_text: list) -> list: 
    timestamps = []
    for chunk in chunked_text: 
        result = gpt_api_call(chunk)
        timestamps.append(result.choices[0].message.content)
    # for index in range(1): 
    #     result = gpt_api_call(chunked_text[0])
    #     timestamps.append(result.choices[0].message.content)
    return timestamps

# print(response)

if __name__ == '__main__':
    chunked_text = handle_chunking_text('3hr-audio-file.txt')
    timestamps = create_timestamps(chunked_text)
    print(timestamps)
    with open('result-gpt.txt', 'w') as file: 
        json.dump(timestamps, file)
    