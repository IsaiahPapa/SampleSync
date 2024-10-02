"use client";

import { useState } from "react";
import SampleCard from "./SampleCard";
import { Input } from "./ui/input";
import { AudioSample } from "@/lib/types";
import DirectoryCard from "./DirectoryCard";


const SampleList = ({ samples, directories, handleSaveSample, onDirectoryClick }: { samples: AudioSample[], directories: string[], handleSaveSample: (updatedSample: AudioSample) => void, onDirectoryClick: (dir: string) => void }) => {
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
    return (
        <>
            <Input
                type="text"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                // className="w-full px-4 py-1 rounded-full border text-black"
            />
            {console.log({filteredDirectories})}
            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredDirectories.map((dir) => (
                    <DirectoryCard
                        key={dir}
                        directory={dir}
                        onClick={() => onDirectoryClick(dir)}
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
        </>
    );
};

export default SampleList;
