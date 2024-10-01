"use client";

import React from "react";
import { useDropzone } from "react-dropzone";

const DragDropOverlay = ({ onDrop }: { onDrop: (files: File[]) => void }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            onDrop(acceptedFiles);
        },
    });

    return (
        <div
            {...getRootProps()}
            className="rounded-xl border-2 border-dashed border-neutral-600 p-4 w-full h-32 flex items-center justify-center"
        >
            <input {...getInputProps()} />
            {isDragActive ? (
                <p className="text-neutral-600">Drop the files here...</p>
            ) : (
                <p className="text-neutral-600">
                    Drag 'n' drop some files here, or click to select files
                </p>
            )}
        </div>
    );
};

export default DragDropOverlay;
