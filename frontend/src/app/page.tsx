'use client';
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const handleUploadVideo = () => {
    const input = inputRef.current;
    if (input == null) {
      throw new Error("Input cannot be null");
    }
    input.click();
  };

  const handleFileChange = () => {
    const input = inputRef.current;
    if (input == null || input.files == null || input.files.length === 0) {
      return;
    }
    setFile(input.files[0]);
    uploadFile(input.files[0]);
  };

  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append("video", file);

    fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
      headers: {
        'Access-Control-Allow-Origin':'*'
      }
    })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
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
      <p>Watch only the important parts</p>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        name="video"
        accept=".mp4,.mp3,.m4a,.mov"
      />
      <button onClick={handleUploadVideo}>Upload video</button>
    </div>
  );
}
