"use client";

import React from "react";
import { FaFolder } from "react-icons/fa";

const DirectoryCard = ({ directory, onClick }: { directory: string, onClick: () => void }) => {
    const dirName = directory.split('/').pop();

    return (
        <div
            className="relative text-white bg-opacity-10 bg-white p-4 rounded-xl shadow-md hover:shadow-lg cursor-pointer"
            onClick={onClick}
        >
            <div className="flex justify-between items-center">
                <FaFolder className="text-yellow-500 mr-2" />
                <h3 className="font-bold text-lg truncate">
                    {dirName}
                </h3>
            </div>
        </div>
    );
};

export default DirectoryCard;