'use client'

import { useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; 

export default function Home() {
    // Video States
    const [videoPreview, setVideoPreview] = useState<string>()
    
    // Audio States
    const [isExtractingAudio, setIsExtractingAudio] = useState<string>()
    const [extractedAudio, setExtractedAudio] = useState<string>()
    
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
        const audioUrl = await audioExtraction(videoFile)
        setExtractedAudio(audioUrl)

        // Upload audio to s3 for processing
        const s3Client = new S3Client()
        const bucketName = "slice-data"
        await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: "my-first-object.txt",
              Body: "Hello JavaScript SDK!",
            })
          );

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
        return URL.createObjectURL(
          new Blob([data.buffer], { type: "audio/mp3" })
        );
    };

    useEffect(()=>{
        
        videoInput.current?.addEventListener("change", handleFileChange)

        return () => {
            videoInput.current?.removeEventListener("change", handleFileChange)
        }

    }, [])

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
        </div>
    )
}