'use client';
import { useEffect, useRef, useState } from "react";

export default function Home() {
  interface Transcription {
    [key: string]: [string, { start: number, end: number }];
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(false)

  const handleUploadVideo = () => {
    const input = inputRef.current;
    if (input == null) {
      throw new Error("Input cannot be null");
    }
    input.click();
  };

  const getSubscription = () => {
    fetch("http://127.0.0.1:5000/transcription", { method:"GET" }).then((response) => {
      response.json().then((json) => setTranscription(json))
    })
  }

  const handleFileChange = () => {
    const input = inputRef.current;
    if (input == null || input.files == null || input.files.length === 0) {
      return;
    }
    setFile(input.files[0]);
    uploadFile(input.files[0]);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("video", file);
    setIsLoading(true)
    await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
      headers: {
        'Access-Control-Allow-Origin':'*'
      }
      }).then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });

      await fetch("http://127.0.0.1:5000/transcription", { method:"GET" }).then((response) => {
        response.json().then((json) => setTranscription(json))
      })
      setIsLoading(false)
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
      {isLoading == true ? <p>Loading</p>: null }
      <p>Watch only the important parts</p>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        name="video"
        accept=".mp4,.mp3,.m4a,.mov"
      />
      <button onClick={handleUploadVideo}>Upload video</button>
      <button onClick={getSubscription}>Get transcription</button>
      <div>
      {
          transcription != null ? 
            Object.keys(transcription).map((key) => {
              return <div key={key}>
                <p>{key}</p>
                <p>{transcription[key][0]}</p>
                <p>start: {transcription[key][1]['start']}</p>
                <p>end: {transcription[key][1]['end']}</p>
              </div>
            })
           : null
      }
      </div>
    </div>
  );
}
