import { AudioSample } from "@/lib/types";
import { BaseDirectory, createDir, readBinaryFile, readTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path"; // Import the join function
import { path } from "@tauri-apps/api";
import { calculateFileHash, getAudioInfo } from "./audio";
import { v4 as uuidv4 } from 'uuid';

export const SAMPLE_DIR = "SampleSync"; // Folder name where samples are stored


export const getSampleDirectory = async () => {
    return await path.documentDir().then((dir) => join(dir, SAMPLE_DIR));
};

export const ensureSampleDirectoryExists = async () => {
    try {
        const sampleDir = await getSampleDirectory();
        await createDir(sampleDir, {
            recursive: true,
        });
    } catch (err) {
        console.error("Error creating sample directory:", err);
    }
};

export const saveSampleInformation = async (fileName: string, sample: AudioSample) => {

    const metadataFileName = `${fileName}.json`;
    const metadataPath = await join(await path.documentDir(), SAMPLE_DIR, sample.folder, metadataFileName);

    await writeBinaryFile(  
        metadataPath,
        new TextEncoder().encode(JSON.stringify(sample))
    );
    return sample;
};

export const loadSampleInformation = async (absoluteFilePath: string) => {
    try {
        const metadataPath = absoluteFilePath.replace(/\.[^/.]+$/, '.json');
        const metadataContent = await readTextFile(metadataPath);
        return JSON.parse(metadataContent) as AudioSample;
    } catch (err) {
        console.error("Error loading metadata:", err);
        return null;
    }
};



export const createSample = async (absoluteOriginalFilePath: string, directory: string) => {
    try {

        // Read file as binary data
        const fileArrayBuffer = await readBinaryFile(absoluteOriginalFilePath);
        const fileName = await path.basename(absoluteOriginalFilePath);
        const binaryData = new Uint8Array(fileArrayBuffer);
        
         // Remove the extension
        // Construct the full URL path
        // const destinationPath = await join(
        //     await path.documentDir(),
        //     sampleDir,
        //     fileName
        // );

        const targetDirectory = await join(await path.documentDir(), SAMPLE_DIR, directory);
        const destinationPath = await join(targetDirectory, fileName);
        

        // Save the file to the samples directory using Tauri
        await writeBinaryFile(
            destinationPath,
            binaryData,
        );

        const file = new File([binaryData], fileName);
        const audioMetadata = await getAudioInfo(file);
        const fileHash = await calculateFileHash(file);
        // Save metadata

        const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

        const realtivePath = await path.join(directory, fileName);

        const sample = await saveSampleInformation(fileNameWithoutExtension, {
            id: uuidv4(),
            originalName: file.name,
            title: file.name,
            folder: directory,
            isSynced: false,
            tags: [],
            url: realtivePath,
            hash: fileHash,
            createdAt: new Date(),
            updatedAt: new Date(), // Add this line
            media: {
                type: audioMetadata.type,
                duration: audioMetadata.duration,
                sampleRate: audioMetadata.sampleRate,
                bitRate: audioMetadata.bitRate,
            }, // Add this line
        });


        // Return the new sample object
        return sample;
    } catch (err) {
        console.error("Error creating sample:", err);
        throw err;
    }
};
