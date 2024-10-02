"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    readDir,
    BaseDirectory,
    writeBinaryFile,
    readBinaryFile,
    createDir,
} from "@tauri-apps/api/fs";
import SampleList from "./SampleList";
import DragDropOverlay from "./DragDropOverlay";

import { join, resolve } from "@tauri-apps/api/path"; // Import the join function
import { path } from "@tauri-apps/api";
import { calculateFileHash, getAudioInfo } from "@/lib/audio";
import { ensureSampleDirectoryExists, loadSampleInformation, saveSampleInformation, SAMPLE_DIR, createSample, getSampleDirectory } from "@/lib/sample";
import { AudioSample } from "@/lib/types";
import toast from "react-hot-toast";


const SampleManager = () => {
    const [samples, setSamples] = useState<AudioSample[]>([]);
    const [currentDir, setCurrentDir] = useState<string>("");
    const [directories, setDirectories] = useState<string[]>([]);
    const [baseDir, setBaseDir] = useState<string>("");

    const canGoBack = useMemo(() => currentDir !== baseDir, [currentDir, baseDir]);

    const handleSaveSample = async (s: AudioSample) => {
        try {
            const fileName = s.originalName.split('/').pop();
            if (!fileName) {
                console.error("No file name for sample", s);
                return;
            }
            await saveSampleInformation(fileName, s);
            setSamples((prevSamples) =>
                prevSamples.map((sample) => (sample.id === s.id ? s : sample))
            );
        } catch (err) {
            console.error("Error saving sample:", err);
        }
    };

    // Function to load samples from the directory
    const loadSamplesFromDirectory = async (dir: string) => {
        try {
            console.log('Loading samples from directory:', dir);
            // Read the directory containing samples
            const entries = await readDir(dir, {
                recursive: false,
            });

            // Map the files to AudioSample objects
            const audioSamples = await Promise.all(
                entries
                    
                    .filter((entry) => {
                        const audioExtensions = [
                            ".aiff",
                            ".ds",
                            ".dwp",
                            ".flac",
                            ".mp3",
                            ".ogg",
                            ".sf2",
                            ".speech",
                            ".syn",
                            ".xi",
                            ".wav",
                        ];
                        return audioExtensions.some((ext) =>
                            entry.name?.toLowerCase().endsWith(ext)
                        );
                    })
                    .filter((entry) => entry.path && !entry.children)
                    .map(async (entry, index) => {
                        const metadata = await loadSampleInformation(
                            entry.path
                        );
                        if (!metadata) {
                            const sample = await createSample(
                                entry.path,
                                SAMPLE_DIR
                            );
                            console.error("No metadata for sample", entry);
                            return sample;
                        }
                        return metadata;
                    })
            );

            const validAudioSamples = audioSamples.filter(
                (sample) => sample !== undefined
            );

            setSamples(validAudioSamples);
            setDirectories(entries.filter((entry) => entry.children).map((entry) => entry.path));
        } catch (err) {
            console.error("Error loading samples from directory:", err);
        }
    };

    const handleDirectoryClick = (dir: string) => {
        setCurrentDir(dir);
    };
    
    const handleFileDrop = async (files: File[]) => {
        try {
            console.log('Dropped files:', files);
            for (const file of files) {
                const filePath = await path.resolve(file.name);
                const sample = await createSample(filePath, SAMPLE_DIR);
                toast.success(`Sample ${sample.title} created`);
                setSamples((prevSamples) => [
                    ...prevSamples,
                    sample,
                ]);
            }
        } catch (err) {
            console.error("Error saving files:", err);
        }
    };

    const handleCreateDirectory = async () => {
        const newDirName = prompt("Enter new directory name:");
        if (newDirName) {
            const newDirPath = `${currentDir}/${newDirName}`;
            try {
                await createDir(newDirPath, { dir: BaseDirectory.Document, recursive: true });
                toast.success(`Directory ${newDirName} created`);
                loadSamplesFromDirectory(currentDir);
            } catch (err) {
                console.error("Error creating directory:", err);
                toast.error("Failed to create directory");
            }
        }
    };

    const handleGoBack = () => {
        if(!canGoBack) return;
        const parentDir = currentDir.split('/').slice(0, -1).join('/');
        setCurrentDir(parentDir || baseDir);
        
    };

    useEffect(() => {
        const mount = async () => {
            await ensureSampleDirectoryExists();
            const resolvedBaseDir = await getSampleDirectory();
            setBaseDir(resolvedBaseDir);
            setCurrentDir(resolvedBaseDir);
            await loadSamplesFromDirectory(resolvedBaseDir);
        };
        mount();
    }, []);

    useEffect(() => {
        loadSamplesFromDirectory(currentDir);
    }, [currentDir]);
    
    console.log({currentDir, directories});

    return (
        <div className="relative flex flex-col gap-6 p-6">
            <div className="flex justify-between items-center">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleCreateDirectory}
                >
                    Add Directory
                </button>
                {canGoBack && (
                    <button
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={handleGoBack}
                    >
                        Go Back
                    </button>
                )}
            </div>
            <DragDropOverlay samples={samples} onDrop={handleFileDrop} />
            <SampleList
                handleSaveSample={handleSaveSample}
                samples={samples}
                directories={directories}
                onDirectoryClick={handleDirectoryClick}
            />
        </div>
    );
};

export default SampleManager;
