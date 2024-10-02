"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { AudioSample, FileWithDirectory } from "@/lib/types";
import { calculateFileHash, calculateFileHashFromFileLocation } from "@/lib/audio";
import toast from "react-hot-toast";
import { readBinaryFile, readDir } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";


const DragDropOverlay = ({
    onDrop,
    samples,
}: {
    onDrop: (files: FileWithDirectory[]) => void;
    samples: AudioSample[];
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInternalDrag = useRef(false);


    const resetDragging = useRef(
        debounce(() => {
            console.log("resetDragging");
            setIsDragging(false);
            isInternalDrag.current = false;
        }, 300)
    ).current;

    useEffect(() => {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;


        const handleDragStart = (e: DragEvent) => {
            console.log("Drag start");
            isInternalDrag.current = true;
        };

        const handleFileDrop = async (e: any) => {
            if (isInternalDrag.current) {
                isInternalDrag.current = false;
                return;
            }
            console.log("Dropped files:", e.payload);

            const newFiles: FileWithDirectory[] = [];

            const processFile = async (filePath: string, directory: string[]) => {
                const fileName = filePath.split('/').pop() || filePath;
                if (fileName.startsWith('.')) {
                    console.log(`Skipping hidden file: ${fileName}`);
                    return;
                }

                const fileArrayBuffer = await readBinaryFile(filePath);
                const binaryData = new Uint8Array(fileArrayBuffer);
                const file = new File([binaryData], filePath);
                const fileHash = await calculateFileHash(file);

                console.log(`Processing file: ${fileName} in directory: ${directory}`);

                const fileHashExists = await Promise.all(samples.map(async (sample) => {
                    if (!sample.hash) {
                        sample.hash = await calculateFileHashFromFileLocation(sample.url);
                    }
                    return sample.hash === fileHash;
                })).then(results => results.some(result => result));
                const fileNameExists = samples.some(sample => sample.originalName === fileName);
                if (fileHashExists) {
                    toast.error(`Duplicate sample detected!`);
                    console.log(`File ${filePath} already exists in the program, disregarding drop`);
                } else if (fileNameExists) {
                    toast.error(`Sample with name ${fileName} already exists!`);
                    console.log(`File ${filePath} with the name ${fileName} already exists in the program, disregarding drop`);
                } else {
                    newFiles.push({ file, directory });
                }
            };

            const processDirectory = async (dirPath: string, parentDir: string[] = []) => {
                const entries = await readDir(dirPath, { recursive: true });
                for (const entry of entries) {
                    const currentDir = entry.name ? [...parentDir, entry.name] : parentDir;
                    if (entry.children) {
                        await processDirectory(entry.path, currentDir);
                    } else {
                        await processFile(entry.path, parentDir);
                    }
                }
            };
        

            await Promise.all(
                e.payload.map(async (filePath: string) => {
                    try{
                        console.log({filePath})
                        // const isDirectory = (await readDir(filePath)).length > 0;
                        const isDirectory = await invoke<boolean>('is_dir', { path: filePath }); // Call the Rust function

                        if (isDirectory) {
                            const rootDirName = filePath.split('/').pop() || filePath;
                            await processDirectory(filePath, [rootDirName]);
                        } else {
                            await processFile(filePath, []);
                        }
                    }catch(e){
                        console.log(e);
                    }

                })
            );

            if (newFiles.length > 0) {
                console.log("Processed files with directory structure:", newFiles);
                onDrop(newFiles); // Uncomment this line to call onDrop with the newFiles array
            }

            setIsDragging(false);
        };

        const handleDropCancelled = () => {
            if (isInternalDrag.current) {
                console.log("User dragged sample outside to external program");
            }
            isInternalDrag.current = false;
            setIsDragging(false);
        };

        const handleDropHover = () => {
            if (isInternalDrag.current) return;
            setIsDragging(true);
        };

        appContainer.addEventListener("dragstart", handleDragStart);

        const unlisten = listen("tauri://file-drop", handleFileDrop);
        const unlistenDropCancelled = listen(
            "tauri://file-drop-cancelled",
            handleDropCancelled
        );
        const unlistenDropHover = listen(
            "tauri://file-drop-hover",
            handleDropHover
        );

        return () => {
            appContainer.removeEventListener("dragstart", handleDragStart);

            unlisten.then((fn) => fn());
            unlistenDropCancelled.then((fn) => fn());
            unlistenDropHover.then((fn) => fn());

            if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
            }
        };
    }, [resetDragging, samples]);

    return (
        <AnimatePresence>
            {isDragging && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 pointer-events-none"
                >
                    <div className="rounded-xl border-2 border-dashed border-neutral-600 p-4 w-full h-full flex items-center justify-center">
                        <p className="text-neutral-600">
                            Drag 'n' drop some files here, or click to select
                            files
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DragDropOverlay;
