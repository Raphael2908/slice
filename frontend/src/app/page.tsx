"use client";
import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  interface Transcription {
    [key: string]: [string, { start: number; end: number }];
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);

  // Loading States
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);
  const [isUpLoadingFile, setIsUpLoadingFile] = useState(false);
  const ffmpegLoadingRef = useRef<HTMLParagraphElement | null>(null)

  
  // Initialisation
  const ffmpegRef = useRef(new FFmpeg());
  const uuid =  uuidv4()

  const handleUploadVideo = () => {
    const input = inputRef.current;
    if (input == null) {
      throw new Error("Input cannot be null");
    }
    input.click();
  };

  const getTranscription = () => {
    fetch(`http://127.0.0.1:5000/api/transcription?uuid=${uuid}`, { method: "GET" }).then(
      (response) => {
        response.json().then((json) => setTranscription(json));
      }
    );
  };

  const handleFileChange = async () => {
    const input = inputRef.current;

    if (input == null || input.files == null || input.files.length === 0) {
      throw new Error("No video uploaded");
    }

    // creates preview on client
    const file = input.files[0];
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);

    // extract audio
    const doExtraction = async () => {
      
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        if (ffmpegLoadingRef.current) ffmpegLoadingRef.current.innerHTML = message
      })

      // Load ffmpeg
      if (!ffmpeg.loaded) {
        await ffmpeg.load();
      }
      // Write input to filesystem
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

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

    setIsExtractingAudio(true)
    const audioFile = await doExtraction();
    setIsExtractingAudio(false)

    setAudio(audioFile);

    // Encode file and upload
    let blob = await fetch(audioFile).then((r) => r.blob());
    uploadFile(blob);

    // Clean up the object URL when the component unmounts or videoFile changes
    return () => {
      URL.revokeObjectURL(url);
    };
  };

  const uploadFile = async (blob: Blob) => {
    if (blob == null) {
      throw new Error("Audio is null");
    }
    // send audio file to backend for processing
    const formData = new FormData(); // Advised to use FormData by Next.js
    formData.append("audio", blob);
    formData.append("uuid", uuid)

    setIsUpLoadingFile(true);
    await fetch("http://127.0.0.1:5000/api/upload", {
      method: "POST",
      body: formData,
    }).then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
      
    setIsUpLoadingFile(false);
    
    // get the transcription from the backend
    await fetch(`http://127.0.0.1:5000/api/transcription?uuid=${uuid}`, {
      method: "GET",
    }).then((response) => {
      response.json().then((json) => setTranscription(json));
    });
  };

  useEffect(() => {
    const input = inputRef.current;
    if (input != null) {
      input.addEventListener("change", handleFileChange);
    }

    return () => {
      if (input != null) {
        input.removeEventListener("change", handleFileChange);
      }
    };
  }, []);

  return (
    <div className="flex justify-center w-full">
      <h1 className="text-3xl font-bold underline">Slice</h1>
      {/* Loading States */}
      {isExtractingAudio == true ? <p>Extracing Audio</p> : null}
      {isUpLoadingFile == true ? <p>Uploading File</p> : null}
      <p ref={ffmpegLoadingRef}></p>
      <p>Watch only the important parts</p>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        name="video"
        accept=".mp4,.mov"
      />
      {preview && (
        <video width="1000" controls>
          <source src={preview + "#t=20,50"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {audio && (
        <audio controls>
          <source src={audio} type="audio/mp3"></source>
        </audio>
      )}

      <button onClick={handleUploadVideo}>Upload video</button>
      <button onClick={getTranscription}>Get transcription</button>
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
  );
}
