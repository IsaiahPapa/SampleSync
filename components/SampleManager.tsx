"use client";

import React, { useState, useEffect } from "react";
import {
    readDir,
    BaseDirectory,
    writeBinaryFile,
    createDir,
    readTextFile,
} from "@tauri-apps/api/fs";
import SampleList from "./SampleList";
import DragDropOverlay from "./DragDropOverlay";
import { AudioSample } from "@/hooks/useSampleManager";
import { join } from "@tauri-apps/api/path"; // Import the join function
import { path } from "@tauri-apps/api";

const ensureSampleDirectoryExists = async () => {
    try {
        await createDir(SAMPLE_DIR, {
            dir: BaseDirectory.Document,
            recursive: true,
        });
    } catch (err) {
        console.error("Error creating sample directory:", err);
    }
};

const SAMPLE_DIR = "SampleSync"; // Folder name where samples are stored

const saveMetadata = async (fileName: string, tags: string[]) => {
    const metadata = { tags };
    const metadataFileName = `${fileName}.json`;
    await writeBinaryFile(
        `${SAMPLE_DIR}/${metadataFileName}`,
        new TextEncoder().encode(JSON.stringify(metadata)),
        {
            dir: BaseDirectory.Document,
        }
    );
};

const loadMetadata = async (fileName: string) => {
    try {
        const metadataFileName = `${fileName}.json`;
        const metadataPath = await join(
            await path.documentDir(),
            SAMPLE_DIR,
            metadataFileName
        );
        const metadataContent = await readTextFile(metadataPath, {
            dir: BaseDirectory.Document,
        });
        return JSON.parse(metadataContent);
    } catch (err) {
        console.error("Error loading metadata:", err);
        return { tags: [] };
    }
};

const addTagToFile = async (fileName: string, newTag: string) => {
    try {
        const metadata = await loadMetadata(fileName);
        if (!metadata.tags.includes(newTag)) {
            metadata.tags.push(newTag);
            await saveMetadata(fileName, metadata.tags);
        }
    } catch (err) {
        console.error("Error adding tag to file:", err);
    }
};

const removeTagFromFile = async (fileName: string, tagToRemove: string) => {
    try {
        const metadata = await loadMetadata(fileName);
        const updatedTags = metadata.tags.filter((tag: string) => tag !== tagToRemove);
        await saveMetadata(fileName, updatedTags);
    } catch (err) {
        console.error("Error removing tag from file:", err);
    }
};

const SampleManager = () => {
    const [samples, setSamples] = useState<AudioSample[]>([]);

    const handleSaveSample = async (updatedSample: AudioSample) => {
        try {
            await saveMetadata(updatedSample.name, updatedSample.tags);
            setSamples((prevSamples) =>
                prevSamples.map((sample) =>
                    sample.id === updatedSample.id ? updatedSample : sample
                )
            );
        } catch (err) {
            console.error("Error saving sample:", err);
        }
    };

    // Function to load samples from the directory
    const loadSamplesFromDirectory = async () => {
        try {
            // Read the directory containing samples
            const entries = await readDir(SAMPLE_DIR, {
                dir: BaseDirectory.Document,
            });

            // Map the files to AudioSample objects
            const loadedSamples: AudioSample[] = await Promise.all(
                entries
                    .filter((entry) => entry.name?.endsWith(".wav")) // You can adjust the file extension as needed
                    .map(async (entry, index) => {
                        const metadata = await loadMetadata(entry.name || "Unknown");
                        return {
                            id: String(index),
                            name: entry.name || "Unknown",
                            tags: metadata.tags,
                            url: entry.path,
                        };
                    })
            );

            setSamples(loadedSamples);
        } catch (err) {
            console.error("Error loading samples from directory:", err);
        }
    };

    // Handle file drop
    const handleFileDrop = async (files: File[]) => {
        try {
            console.log('Dropped files:', files);
            for (const file of files) {
                // Read file as binary data
                const fileArrayBuffer = await file.arrayBuffer();
                const binaryData = new Uint8Array(fileArrayBuffer);

                // Save the file to the samples directory using Tauri
                await writeBinaryFile(
                    `${SAMPLE_DIR}/${file.name}`,
                    binaryData,
                    {
                        dir: BaseDirectory.Document,
                    }
                );

                // Save metadata
                await saveMetadata(file.name, ["new"]);

                // Construct the full URL path
                const filePath = await join(
                    await path.documentDir(),
                    SAMPLE_DIR,
                    file.name
                );

                // Optionally add the file to the sample list immediately
                setSamples((prevSamples) => [
                    ...prevSamples,
                    {
                        id: String(prevSamples.length),
                        name: file.name,
                        tags: ["new"],
                        url: filePath,
                    },
                ]);
            }
        } catch (err) {
            console.error("Error saving files:", err);
        }
    };

    useEffect(() => {
        const mount = async () => {
            await ensureSampleDirectoryExists();
            // Load samples when the component mounts
            await loadSamplesFromDirectory();
        };
        mount();
    }, []);

    return (
        <div className="relative flex flex-col gap-6 p-6">
            <DragDropOverlay onDrop={handleFileDrop} />
            <SampleList handleSaveSample={handleSaveSample} samples={samples} />
        </div>
    );
};

export default SampleManager;
