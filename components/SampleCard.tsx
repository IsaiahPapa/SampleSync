"use client";
import { AudioSample } from "@/lib/types";
import React, { useState } from "react";
import { FaSave, FaCloudUploadAlt, FaEdit } from "react-icons/fa";
import EditSampleModal from "./EditSampleModal";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { motion } from "framer-motion";
import { getSampleDirectory } from "@/lib/sample";
import { path } from "@tauri-apps/api";

const ProgressUnderlay = ({ progress }: { progress: number }) => {
    return (
        <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center -z-[1]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%`, opacity: progress === 0 ? 0 : 1 - (progress)/100 }}
            transition={{ ease: "linear", duration: 0.1 }}
        />
    );
};
const getSampleRateColor = (sampleRate: number) => {
    if (sampleRate >= 96000) return "bg-green-500";
    if (sampleRate >= 48000) return "bg-blue-500";
    if (sampleRate >= 44100) return "bg-yellow-500";
    return "bg-red-500";
};
const formatSampleRate = (sampleRate: number) => {
    if (sampleRate >= 1000) {
        return `${(sampleRate / 1000).toFixed(1)}kHz`;
    }
    return `${sampleRate}Hz`;
};

interface SampleCardProps {
    sample: AudioSample;
    isLocal: boolean;
    onSaveSample: (updatedSample: AudioSample) => void; // Add this prop to save the updated sample
}

const SampleCard: React.FC<SampleCardProps> = ({
    sample,
    isLocal,
    onSaveSample,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleEditClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleSaveSample = (updatedSample: AudioSample) => {
        onSaveSample(updatedSample);
    };

    const handleSampleClick = async (url: string) => {
        try {
            const sampleDir = await getSampleDirectory();
            const uint8Array = await readBinaryFile(await path.join(sampleDir, url));
            const arrayBuffer = uint8Array.buffer;
            const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            const startTime = audioContext.currentTime;
            const duration = audioBuffer.duration;

            const updateProgress = () => {
                const elapsedTime = audioContext.currentTime - startTime;
                const newProgress = (elapsedTime / duration) * 100;
                

                if (elapsedTime < duration) {
                    setProgress(newProgress);
                    requestAnimationFrame(updateProgress);
                }else{
                    setProgress(100);
                    setTimeout(() => setProgress(0), 500);
                }
            };

            requestAnimationFrame(updateProgress);
        } catch (error) {
            console.error("Error loading audio file:", error);
        }
    };

    const handleDragStart = async (
        event: React.DragEvent<HTMLDivElement>,
        sample: AudioSample
    ) => {
        try {

        const dragImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGIpbl3AQApgIkn1qIZRDUNKAyAAAP//G64Bu2LaQ+8AAAAASUVORK5CYII="; // Your actual image
        
            await startDrag({
                "item": [sample.url],
                icon: dragImage,
            });
        } catch (error) {
            console.error("Error reading file for drag and drop:", error);
        }
    };

    return (
        <>
            <div
                className="relative text-white bg-opacity-10 bg-white p-4 rounded-xl shadow-md hover:shadow-lg cursor-pointer  overflow-hidden"
                draggable
                onDragStart={(event) => handleDragStart(event, sample)}
                onClick={() => handleSampleClick(sample.url)}
            >
                <ProgressUnderlay progress={progress} />
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg truncate">
                        {sample.title}
                    </h3>
                    <div className="flex items-center">
                        {isLocal ? (
                            <FaSave className="text-green-500 mr-2" />
                        ) : (
                            <FaCloudUploadAlt className="text-gray-500 mr-2" />
                        )}
                        <div
                            className="cursor-pointer"
                            onClick={handleEditClick}
                        >
                            <FaEdit className="text-blue-500 cursor-pointer" />
                        </div>
                    </div>
                </div>
                {/* <div className="h-16 bg-gray-200 rounded mt-2 flex items-center justify-center">
                    <span className="text-gray-500">Waveform Placeholder</span>
                </div> */}
                <div className="flex flex-wrap mt-2">
                    {sample.tags.map((tag) => (
                        <span
                            key={tag}
                            className="bg-blue-500 text-white text-sm py-1 rounded-full px-4 mr-2 capitalize"
                        >
                            {tag}
                        </span>
                    ))}
                    {sample.media.duration >= 1 && (
                        <span className="bg-gray-500 text-white text-sm py-1 rounded-full px-4 mr-2">
                            {Math.floor(sample.media.duration / 60)}:
                            {Math.floor(sample.media.duration % 60)
                                .toString()
                                .padStart(2, "0")}{" "}
                            min
                        </span>
                    )}
                    <span
                        className={`${getSampleRateColor(
                            sample.media.sampleRate
                        )} text-white text-sm py-1 rounded-full px-4 mr-2`}
                    >
                        {formatSampleRate(sample.media.sampleRate)}
                    </span>
                </div>
            </div>

            <EditSampleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sample={sample}
                onSave={handleSaveSample}
            />
        </>
    );
};

export default SampleCard;
