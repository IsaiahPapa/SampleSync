"use client";

import { useState } from "react";
import { readBinaryFile } from "@tauri-apps/api/fs";
import SampleCard from "./SampleCard";
import { AudioSample } from "@/hooks/useSampleManager";
import { invoke, path } from "@tauri-apps/api";
import { startDrag } from "@crabnebula/tauri-plugin-drag";


const SampleList = ({ samples, handleSaveSample }: { samples: AudioSample[], handleSaveSample: (updatedSample: AudioSample) => void }) => {
    const [searchText, setSearchText] = useState("");

    const filteredSamples = searchText
        ? samples.filter((sample) =>
              sample.name.toLowerCase().includes(searchText.toLowerCase())
          )
        : samples;

    const handleSampleClick = async (url: string) => {
        try {
            const uint8Array = await readBinaryFile(url);
            const arrayBuffer = uint8Array.buffer;
            const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
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
            <input
                type="text"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-4 py-1 rounded-full border text-black"
            />

            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredSamples.map((sample) => (
                    <SampleCard
                        key={sample.id}
                        sample={sample}
                        onSampleClick={handleSampleClick}
                        onSampleDragStart={handleDragStart}
                        isLocal={Math.random() > 0.5}
                        onSaveSample={handleSaveSample} // Pass the handleSaveSample function
                    />
                ))}
            </div>
        </>
    );
};

export default SampleList;
