from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import math

load_dotenv()

OPENAI_TEST_KEY = os.getenv('OPENAI_TEST_KEY')
OPENAI_SLICE_PROJECT_ID = os.getenv('OPENAI_SLICE_PROJECT_ID')
OPENAI_ORG_ID = os.getenv('OPENAI_ORG_ID')

# chunks large texts into 256 lines/chunk
def handle_chunking_text(filename: str) -> list: 
    """
    Breaksdown transcription into chunks for easier processing

    Params
    ------
    filename: str
        Text file with transcription

    Returns 
    -------
    A list of chunked texts
    """

    chunked_text = []

    # Read in text data from file
    f = open(filename, 'rt')
    data = f.read()
    text_dictionary = json.loads(data)

    chunk_size = 256 # 256 indexes

    keys = text_dictionary.keys()

    chunks = math.floor(len(keys) / chunk_size)
    partial_chunk_size = len(keys) % chunk_size
    large_text = list(text_dictionary.values())

    # Add chunks of text to list
    for i in range(chunks):
        offset = i * chunk_size
        chunk_text = large_text[offset: (chunk_size + offset)]
        chunked_text.append(chunk_text)
    
    # Add partial chunks
    partial_chunk_end = len(keys) - partial_chunk_size
    partial_chunk = large_text[partial_chunk_end:]
    chunked_text.append(partial_chunk)
    print('Texts have been chunked')
    return chunked_text

# calls gpt-3.5-turbo-0125 model via open ai api
def gpt_api_call(transcription_text: list):
    """
    Wrapper for openai api

    Params
    ------
    transcription_text: list
        Chunks of text for processing

    Returns
    ------
    Timestamps and summary title for each chunk of text
    """


    client = OpenAI(api_key=OPENAI_TEST_KEY)
    result_string = ' '.join(
        f"[{sublist[0].strip()} {{start: {sublist[1]['start']}, end: {sublist[1]['end']}}}]" for sublist in transcription_text
    )
    prompt = "You are to analyse a long video transcript and pick out the best sections of the transcript for a student. \n\nEach section must be a minimum of 5mins long and have a title based on your summary of the section\n\nYour output must follow the format of: {Timestamp: Title}"
    response = client.chat.completions.create(
    model="gpt-3.5-turbo-0125",
    messages=[
        {
        "role": "system",
        "content": [
            {
            "text": prompt,
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

# sends chunks to gpt_api_call to generate timestamps
def create_timestamps(chunked_text: list) -> list: 
    """
    Calls the openai api for every chunk in chunked_text

    Params
    ------
    chunked_text: list
        chunks of texts
    
    Returns
    -------
    list: 
        Timestamps of the summary that chatgpt outputs. Not formatted for frontend 
    """
    timestamps = []
    for chunk in chunked_text: 
        result = gpt_api_call(chunk)
        timestamps.append(result.choices[0].message.content) # ChatCompletion object from openai
    return timestamps


def video_filtering(filename: str) -> list: 
    """
    Chains the functions required to produce the timestamps for frontend \n

    Params
    ------
    filename : str
        The text file to be processed

    Returns
    -------
    list: 
        The list of transcriptions:
        ['{159.52: Using React Native to Interface with Other Platforms}', '{241.68: Why APIs are Essential for Accessing Data}', '{676.36: Building a Reddit Client Using APIs}']

    functions include: 
    1. handle_chunking_text(filename: str)
    2. create_timestamps(chunked_text: list)
    """

    chunked_text = handle_chunking_text(filename)
    timestamps = create_timestamps(chunked_text)
    result = []
    for i in range(len(timestamps)): 
        timestamp = timestamps[i].split("\n")
        result.extend(timestamp)

    return result    

if __name__ == '__main__':
    video_filtering('3hr-audio-file.txt')
