"use client";
import { AudioSample } from "@/hooks/useSampleManager";
import React, { useState } from "react";
import { FaSave, FaCloudUploadAlt, FaEdit } from "react-icons/fa";
import EditSampleModal from "./EditSampleModal";

interface SampleCardProps {
    sample: AudioSample;
    onSampleClick: (url: string) => void;
    onSampleDragStart: (
        event: React.DragEvent<HTMLDivElement>,
        sample: AudioSample
    ) => void;
    isLocal: boolean;
    onSaveSample: (updatedSample: AudioSample) => void; // Add this prop to save the updated sample
}

const SampleCard: React.FC<SampleCardProps> = ({
    sample,
    onSampleClick,
    onSampleDragStart,
    isLocal,
    onSaveSample,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEditClick = () => {
        setIsModalOpen(true);
    };

    const handleSaveSample = (updatedSample: AudioSample) => {
        onSaveSample(updatedSample);
    };

    return (
        <div
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer text-black"
            draggable
            onDragStart={(event) => onSampleDragStart(event, sample)}
        >
            <div
                className="flex justify-between items-center"
                onClick={() => onSampleClick(sample.url)}
            >
                <h3 className="font-bold text-lg">{sample.name}</h3>
                <div className="flex items-center">
                    {isLocal ? (
                        <FaSave className="text-green-500 mr-2" />
                    ) : (
                        <FaCloudUploadAlt className="text-gray-500 mr-2" />
                    )}
                    <FaEdit
                        className="text-blue-500 cursor-pointer"
                        onClick={handleEditClick}
                    />
                </div>
            </div>
            <div className="h-16 bg-gray-200 rounded mt-2 flex items-center justify-center">
                <span className="text-gray-500">Waveform Placeholder</span>
            </div>
            <div className="flex flex-wrap mt-2">
                {sample.tags.map((tag) => (
                    <span
                        key={tag}
                        className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full px-4 mr-2 capitalize"
                    >
                        {tag}
                    </span>
                ))}
            </div>
            <EditSampleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sample={sample}
                onSave={handleSaveSample}
            />
        </div>
    );
};

export default SampleCard;
