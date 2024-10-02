import { AudioSample } from "@/lib/types";
import { BaseDirectory, createDir, readBinaryFile, readTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path"; // Import the join function
import { path } from "@tauri-apps/api";
import { calculateFileHash, getAudioInfo } from "./audio";
import { v4 as uuidv4 } from 'uuid';

export const SAMPLE_DIR = "SampleSync"; // Folder name where samples are stored

export const ensureSampleDirectoryExists = async () => {
    try {
        await createDir(SAMPLE_DIR, {
            dir: BaseDirectory.Document,
            recursive: true,
        });
    } catch (err) {
        console.error("Error creating sample directory:", err);
    }
};

export const getSampleDirectory = async () => {
    return await path.documentDir().then((dir) => join(dir, SAMPLE_DIR));
};

export const saveSampleInformation = async (fileName: string, sample: AudioSample) => {

    const metadataFileName = `${fileName}.json`;
    await writeBinaryFile(
        `${SAMPLE_DIR}/${metadataFileName}`,
        new TextEncoder().encode(JSON.stringify(sample)),
        {
            dir: BaseDirectory.Document,
        }
    );
    return sample;
};

export const loadSampleInformation = async (filePath: string) => {
    try {

        const metadataPath = filePath.replace(/\.[^/.]+$/, '.json');
        const metadataContent = await readTextFile(metadataPath, {
            dir: BaseDirectory.Document,
        });
        return JSON.parse(metadataContent) as AudioSample;
    } catch (err) {
        console.error("Error loading metadata:", err);
        return null;
    }
};



export const createSample = async (filePath: string, sampleDir: string) => {
    try {
        // Read file as binary data
        const fileArrayBuffer = await readBinaryFile(filePath, {
            dir: BaseDirectory.Document,
        });
        const binaryData = new Uint8Array(fileArrayBuffer);
        const fileName = await path.basename(filePath);
        const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, ""); // Remove the extension
        // Construct the full URL path
        const destinationPath = await join(
            await path.documentDir(),
            sampleDir,
            fileName
        );
        

        // Save the file to the samples directory using Tauri
        await writeBinaryFile(
            destinationPath,
            binaryData,
            {
                dir: BaseDirectory.Document,
            }
        );

        const file = new File([binaryData], fileName);
        const audioMetadata = await getAudioInfo(file);
        const fileHash = await calculateFileHash(file);
        // Save metadata

        const sample = await saveSampleInformation(fileNameWithoutExtension, {
            id: uuidv4(),
            originalName: file.name,
            title: file.name,
            folder: sampleDir,
            isSynced: false,
            tags: [],
            url: filePath,
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
