"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { readDir } from "@tauri-apps/api/fs";
import DragDropOverlay from "./DragDropOverlay";

import { normalize } from "@tauri-apps/api/path"; // Import the join function
import { path } from "@tauri-apps/api";
import {
    ensureSampleDirectoryExists,
    loadSampleInformation,
    saveSampleInformation,
    SAMPLE_DIR,
    createSample,
} from "@/lib/sample";
import { AudioSample, FileWithDirectory } from "@/lib/types";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import DirectoryCard from "./DirectoryCard";
import SampleCard from "./SampleCard";
import DirectoryBreadcrumbs from "./DirectoryBreadcrumbs";
import { motion } from "framer-motion";

const BackButton = ({ onBack }: { onBack: () => void }) => {
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-white bg-opacity-10 bg-white p-2 px-4 rounded-xl shadow-md hover:shadow-lg cursor-pointer"
            onClick={onBack}
        >
            Go Back
        </motion.button>
    );
};

const SampleManager = () => {
    const [samples, setSamples] = useState<AudioSample[]>([]);
    const [directories, setDirectories] = useState<string[]>([]);

    const [currentDir, setCurrentDir] = useState<string>("/");

    const canGoBack = useMemo(() => currentDir !== "/", [currentDir]);

    const [searchText, setSearchText] = useState("");

    const filteredSamples = searchText
        ? samples.filter((sample) =>
              sample.title.toLowerCase().includes(searchText.toLowerCase())
          )
        : samples;
    const filteredDirectories = searchText
        ? directories.filter((dir) =>
              dir.toLowerCase().includes(searchText.toLowerCase())
          )
        : directories;

    const getEntries = useCallback(async (realtiveDirectory: string) => {
        const absoluteDirectory = await path.join(
            await path.join(await path.documentDir(), SAMPLE_DIR),
            realtiveDirectory
        );
        const entries = await readDir(absoluteDirectory, {
            recursive: false,
        });
        return entries;
    }, []);

    const loadDirectories = async (realtiveDirectory: string) => {
        const absoluteDirectory = await path.join(
            await path.join(await path.documentDir(), SAMPLE_DIR),
            realtiveDirectory
        );
        const entries = await getEntries(realtiveDirectory);
        const directories = entries
            .filter((entry) => entry.children)
            .map((entry) => entry.path.replace(absoluteDirectory, ""));
        setDirectories(directories);
    };

    const handleSaveSample = async (s: AudioSample) => {
        try {
            const fileName = s.originalName.split("/").pop();
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
    const loadSamplesFromDirectory = async (realtiveDirectory: string) => {
        try {
            const entries = await getEntries(realtiveDirectory);

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
                                currentDir
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
        } catch (err) {
            console.error("Error loading samples from directory:", err);
        }
    };
    const reload = useCallback(() => {
        loadDirectories(currentDir);
        loadSamplesFromDirectory(currentDir);
    }, [loadDirectories, loadSamplesFromDirectory, currentDir]);

    const handleDirectoryClick = async (realtiveDirectory: string) => {
        const newDir = await normalize(currentDir + realtiveDirectory);
        setCurrentDir(newDir);
    };

    const handleFileDrop = async (files: FileWithDirectory[]) => {
        try {
            console.log("Dropped files:", files);
            for (const { file, directory } of files) {
                const filePath = await path.resolve(file.name);
                const saveDirectory = await path.join(currentDir, ...directory);

                const sample = await createSample(filePath, saveDirectory);
                toast.success(`Sample ${sample.title} created`);
                reload();
                // setSamples((prevSamples) => [
                //     ...prevSamples,
                //     sample,
                // ]);
            }
        } catch (err) {
            console.error("Error saving files:", err);
        }
    };

    const handleGoBack = async () => {
        if (!canGoBack) return;
        const parentDir = await path.dirname(currentDir);
        setCurrentDir(parentDir || "/");
    };

    useEffect(() => {
        const mount = async () => {
            await ensureSampleDirectoryExists();
            setCurrentDir("/");
            loadDirectories("/");
        };
        mount();
    }, []);

    useEffect(() => {
        reload();
    }, [currentDir]);

    return (
        <>
            <DragDropOverlay samples={samples} onDrop={handleFileDrop} />
            <div className="relative flex flex-col gap-6 p-6">
                <Input
                    type="text"
                    placeholder="Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    // className="w-full px-4 py-1 rounded-full border text-black"
                />

                <div className="flex justify-between items-center h-8">
                    <DirectoryBreadcrumbs
                        onNewDirectory={(dir) => {
                            console.log(dir);
                            setCurrentDir(dir);
                        }}
                        currentDirectory={currentDir}
                    />
                    {canGoBack && <BackButton onBack={handleGoBack} />}
                </div>

                <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredDirectories.map((dir) => (
                        <DirectoryCard
                            key={dir}
                            directory={dir}
                            onClick={() => handleDirectoryClick(dir)}
                        />
                    ))}
                    {filteredSamples.map((sample) => (
                        <SampleCard
                            key={sample.id}
                            sample={sample}
                            isLocal={Math.random() > 0.5}
                            onSaveSample={handleSaveSample}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default SampleManager;
