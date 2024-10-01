import React, { useState } from "react";
import { motion } from "framer-motion";
import { AudioSample } from "@/hooks/useSampleManager";

interface EditSampleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sample: AudioSample;
    onSave: (updatedSample: AudioSample) => void;
}

const EditSampleModal: React.FC<EditSampleModalProps> = ({
    isOpen,
    onClose,
    sample,
    onSave,
}) => {
    const [name, setName] = useState(sample.name);
    const [tags, setTags] = useState<string[]>(sample.tags);

    const handleSave = () => {
        onSave({ ...sample, name, tags });
        onClose();
    };

    const handleAddTag = () => {
        setTags([...tags, ""]);
    };

    const handleTagChange = (index: number, value: string) => {
        const newTags = [...tags];
        newTags[index] = value;
        setTags(newTags);
    };

    const handleRemoveTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index);
        setTags(newTags);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white p-6 rounded-lg shadow-lg"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
            >
                <h2 className="text-xl font-bold mb-4">Edit {sample.name}</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Tags
                    </label>
                    {tags.map((tag, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) =>
                                    handleTagChange(index, e.target.value)
                                }
                                className="border p-2 rounded mr-2 flex-1"
                            />
                            <button
                                onClick={() => handleRemoveTag(index)}
                                className="text-red-500"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleAddTag}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Add Tag
                    </button>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EditSampleModal;
