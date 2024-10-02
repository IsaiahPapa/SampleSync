"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { AudioSample } from "@/lib/types";
import { calculateFileHash, calculateFileHashFromFileLocation } from "@/lib/audio";
import toast from "react-hot-toast";
import { readBinaryFile } from "@tauri-apps/api/fs";

const DragDropOverlay = ({
    onDrop,
    samples,
}: {
    onDrop: (files: File[]) => void;
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

            const newFiles: File[] = [];
            await Promise.all(
                e.payload.map(async (filePath: string) => {
                    const fileArrayBuffer = await readBinaryFile(filePath);
                    const binaryData = new Uint8Array(fileArrayBuffer);
                    const file = new File([binaryData], filePath);
                    const fileHash = await calculateFileHash(file);
                    const fileName = filePath.split('/').pop() || filePath;

                    const fileHashExists = await Promise.all(samples.map(async (sample) => {
                        if (!sample.hash) {
                            sample.hash =
                                await calculateFileHashFromFileLocation(
                                    sample.url
                                );
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
                        newFiles.push(file);
                    }
                })
            );

            if (newFiles.length > 0) {
                onDrop(newFiles);
            }


            setIsDragging(false);
        };

        const handleDropCancelled = () => {
            console.log("Drop cancelled");
            if (isInternalDrag.current) {
                console.log("User dragged sample outside to external program");
            }
            isInternalDrag.current = false;
            setIsDragging(false);
        };

        const handleDropHover = () => {
            if (isInternalDrag.current) return;
            console.log("Drop hover");
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
