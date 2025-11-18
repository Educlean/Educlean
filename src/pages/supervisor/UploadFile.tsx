"use client";
import React from "react";
import Banner from "../../components/Reusable/Banner";
import uploadFile from "../../assets/icons/UploadFile.svg";
import { useState } from "react";
import close from "../../assets/icons/close.svg";
import GButton from "../../components/Reusable/GButton";
import PrimaryButton from "../../components/Reusable/PrimaryButton";
import Image from "next/image";
import Modal from "@/components/Reusable/Modal";

export default function UploadFile() {
  const [files, setFiles] = useState<File[]>([]);
  const [counter, setCounter] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFiles: File[] = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    setCounter((prev) => prev + droppedFiles.length);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = event.target.files;
    if (!filesList) return;
    const selectedFiles: File[] = Array.from(filesList);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setCounter((prev) => prev + selectedFiles.length);
    event.target.value = "";
  };

  const eliminateFile = (index: number) => {
    console.log("Deleting file");
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setCounter(counter - 1);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("There is not file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]); // Only uploads the first file since the API only accepts 1

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIsActive(true);
        setFiles([]); // clean the files array
        setCounter(0);
      } else {
        alert(data.error || "Error uploading file");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    }
  };

  console.log(files);

  return (
    <div className="min-h-screen">
      <Banner
        label="Upload schedule 🗓️"
        description="Share with your team their shifts!"
        className=""
      ></Banner>
      <div className="md:max-w-2xl md:mx-auto lg:max-w-full lg:mx-5">
        <div className="bg-[var(--light-gray)] m-4 p-5 rounded-md md:max-w-2xl md:mx-auto lg:p-0 lg:max-w-full lg:mx-0">
          <p className="text-xl font-semibold md:text-2xl lg:text-xl">
            Upload Files {`(${counter})`}
          </p>
          <p className="mb-3 lg:text-sm">Only Excel Files Allowed</p>
          <label
            className="border-1 border-gray-400 border-dashed p-5 flex flex-col justify-center items-center rounded-md cursor-pointer lg:h-[20rem] "
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Image
              src={uploadFile}
              alt="upload-file-icon"
              className="h-10 w-10 mb-1"
            />
            <p className="md:text-xl">Draw your files here or browse</p>
            <p className="md:text-xl">Supported documents: .xlx</p>
            <p className="md:text-xl">Maximum file size: 20MB</p>

            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            // accept=".xlx"
            />
          </label>
          {files.length > 0
            ? files.map((f, index) => (
              <div
                key={index}
                className="m-4 bg-[var(--light-gray)] px-3 py-2 rounded-md flex justify-between md:mx-0 lg:bg-gray-200"
              >
                <p>{f.name}</p>
                <Image
                  src={close}
                  alt="close-icon"
                  onClick={() => eliminateFile(index)}
                  className="cursor-pointer"
                ></Image>
              </div>
            ))
            : null}
          <div
            className="flex mt-5 gap-2 md:mt-5 
             lg:w-1/2 lg:ml-auto lg:justify-end"
          >
            <GButton
              label="Cancel"
              className="flex-1 border border-gray-400"
            />
            <PrimaryButton
              label="Save schedule"
              className="flex-1"
              onClick={handleUpload}
            />
          </div>



        </div>
      </div>
      {isActive ? <Modal title="File Uploaded" text="Schedule uploaded sucessfully" isOpen={true} onClose={() => setIsActive(false)} /> : null}
    </div>
  );
}