'use client'

import { useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";

export default function Home() {
    interface Transcription {
      [key: string]: [string, { start: number; end: number }];
    }
    // Video States
    const [videoPreview, setVideoPreview] = useState<string>()
    const [uuid, setUuid] = useState<string>()
    const [taskId, setTaskId] = useState<string>() 

    // Audio States
    const [isExtractingAudio, setIsExtractingAudio] = useState<string>()
    const [extractedAudio, setExtractedAudio] = useState<string>()
    const [transcription, setTranscription] = useState<Transcription | null>(null);

    // Refs
    const videoInput = useRef<HTMLInputElement>(null)
    const ffmpegRef = useRef(new FFmpeg());

    // On video upload
    const handleFileChange = async () => {
        // Create video preview
        if(videoInput.current == null) {
            throw new Error("Input field is missing")
        }
        
        if(videoInput.current.files == null) {
            throw new Error("Please upload a file'")
        }
        const videoFile = videoInput.current.files[0]
        const videoUrl = URL.createObjectURL(videoFile)
        setVideoPreview(videoUrl)


        // Extract audio
        const audioBlob: Blob = await audioExtraction(videoFile)
        const audioUrl: string = URL.createObjectURL(audioBlob);
        setExtractedAudio(audioUrl)

        // Send audio to server for transcription 
        const uuid = uuidv4()
        setUuid(uuid)

        // Chunk files
        
        const chunkSize = 512000 // 512 Kilo Bytes
        const fileSize = audioBlob.size
        const fullChunks = (fileSize / chunkSize) | 0 // The | is a or bitwise operator to get the int of the float
        const partialChunkSize = fileSize % chunkSize

        console.log(fullChunks, partialChunkSize, fileSize)

        // Send chunks to server
        for (let chunkId = 0; chunkId < fullChunks; chunkId++) {
          const offset = chunkId * chunkSize 
          const formData = new FormData(); // Advised to use FormData by Next.js

          let chunk: Blob = audioBlob.slice(offset, chunkSize + offset, 'blob')

          formData.append("chunk", chunk);
          formData.append("uuid", uuid)
          formData.append("chunkParams", JSON.stringify({'chunkId': chunkId, 'fullChunks': fullChunks, 'fileSize': fileSize, 'chunkSize': chunk.size}))

          console.log(chunk)
          await fetch("http://127.0.0.1:8000/api/upload", {
            method: "POST",
            body: formData,
            mode: 'cors'
          }).then((response) => {
            console.log(response);
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
          });
        }
        
        if(partialChunkSize != 0){
          const formData = new FormData(); // Advised to use FormData by Next.js
          console.log(partialChunkSize)
          let partialChunk: Blob = audioBlob.slice(-partialChunkSize, fileSize, 'blob')

          formData.append("chunk", partialChunk);
          formData.append("uuid", uuid)
          formData.append("chunkParams", JSON.stringify({'chunkId': fullChunks, 'fullChunks': fullChunks, 'fileSize': fileSize, 'chunkSize': partialChunk.size}))

          console.log(partialChunk)
          await fetch("http://127.0.0.1:8000/api/upload", {
            method: "POST",
            body: formData,
            mode: 'cors'
          }).then((response) => {
            console.log(response);
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
          });
        }

        console.log('sending audio to backend')

        // request server to transcribe audio
        const transcribeFormData = new FormData(); // Advised to use FormData by Next.js
        transcribeFormData.append("uuid", uuid)
        await fetch("http://127.0.0.1:8000/api/transcribe", {
          method: "POST",
          body: transcribeFormData,
          mode: 'cors'
        }).then((response) => {
          console.log(response);
          response.json().then((json) => setTaskId(json['result_id']))
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });

    }

    const audioExtraction = async (video: File) => {
      
        const ffmpeg = ffmpegRef.current;
  
        ffmpeg.on('log', ({ message }) => {
          setIsExtractingAudio(message)
        })
  
        // Load ffmpeg
        if (!ffmpeg.loaded) {
          await ffmpeg.load();
        }
        // Write input to filesystem
        await ffmpeg.writeFile("input.mp4", await fetchFile(video));
  
        // Convert
        await ffmpeg
          .exec(["-i", "input.mp4", "output.mp3"])
          .catch((error) => console.log(error));
        
  
        // Read the converted file from the WASM filesystem
        const data = (await ffmpeg
          .readFile("output.mp3")
          .catch((error) => console.log(error))) as any;
        
        // You can then use this data, for example by creating a URL for it
        const audioBlob: Blob = new Blob([data.buffer], { type: "audio/mp3" })
        return audioBlob
    };

    useEffect(()=>{
        // sockets
        const socket = io("http://127.0.0.1:8000");

        socket.on('connect', function() {
          socket.emit('my event', {data: 'I\'m connected!'});
        });

        if(taskId && uuid){
          socket.on(taskId, async function() {
              await fetch(`http://127.0.0.1:8000/api/transcription?uuid=${uuid}`, {
                method: "GET",
              }).then((response) => {
                response.json().then((json) => setTranscription(json));
              });   
          })
        }
        videoInput.current?.addEventListener("change", handleFileChange)

        return () => {
          socket.disconnect()
          videoInput.current?.removeEventListener("change", handleFileChange)
        }

    }, [uuid, taskId])

    return (
        <div className="container mx-auto">
            <h1 className="text-cyan-700">Slice</h1>
            <p className="">Watch only the important parts</p>
           
            {videoPreview && 
            <div>
                    <video width={1000} controls>
                        <source src={videoPreview} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
            </div>
            }
            {isExtractingAudio && <h1>Extracting Audio: {isExtractingAudio}</h1>}
            {extractedAudio && 
                <audio controls>
                    <source src={extractedAudio} type="audio/mp3"></source>
                </audio>
            }
            
            <input className="hidden" type="file" name="video" id="" ref={videoInput} />
            <button className="bg-cyan-700 text-white p-2 rounded-sm" type="button" onClick={() => videoInput.current!.click()}>Upload Video</button>
            <div>
            {transcription != null
              ? Object.keys(transcription).map((key) => {
                  return (
                    <div key={key}>
                      <p>{key}</p>
                      <p>{transcription[key][0]}</p>
                      <p>start: {transcription[key][1]["start"]}</p>
                      <p>end: {transcription[key][1]["end"]}</p>
                    </div>
                  );
                })
              : null}
          </div>
        </div>
        
    )
}