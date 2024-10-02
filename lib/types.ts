export type AudioSample = {
    id: string;
    originalName: string; // Original file name
    title: string; // Display title
    description?: string; // Optional description
    url: string; // File URL to drag into other apps
    folder: string; // Folder path or ID
    tags: string[];
    hash: string | null; // Add hash property
    isSynced: boolean; // Flag to indicate if the sample is synced locally    
    createdAt: Date; // Creation date
    updatedAt: Date; // Last modified date
    

    media: {
        type: string; // Media type (e.g., 'audio/mp3', 'audio/wav')
        duration: number; // Duration of the audio sample in seconds
        sampleRate: number; // Sample rate in Hz
        bitRate: number; // Bit rate in kbps
    };
};

export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> &
        Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];


