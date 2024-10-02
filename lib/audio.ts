import { readBinaryFile } from "@tauri-apps/api/fs";
import CryptoJS from "crypto-js";

export const calculateFileHash = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target?.result as string;
            const hash = CryptoJS.SHA256(
                CryptoJS.enc.Latin1.parse(fileContent)
            ).toString();
            resolve(hash);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

export const calculateFileHashFromFileLocation = async (
    filePath: string
): Promise<string> => {
    const fileArrayBuffer = await readBinaryFile(filePath);
    const binaryData = new Uint8Array(fileArrayBuffer);
    const file = new File([binaryData], filePath);
    return await calculateFileHash(file);
};


export const getAudioInfo = async (file: File) => {
    const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return {
        type: file.type,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        bitRate: (arrayBuffer.byteLength * 8) / audioBuffer.duration / 1000 // in kbps
    };
};
