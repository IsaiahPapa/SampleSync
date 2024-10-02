import React, { useState } from "react";
import { motion } from "framer-motion";
import { AudioSample } from "@/lib/types";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"

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
    const [title, setTitle] = useState(sample.title);
    const [tags, setTags] = useState<string[]>(sample.tags);

    const handleSave = () => {
        onSave({ ...sample, title, tags });
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {sample.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>Tags</Label>
                        {tags.map((tag, index) => (
                            <div key={index} className="flex items-center mt-2">
                                <Input
                                    type="text"
                                    value={tag}
                                    onChange={(e) =>
                                        handleTagChange(index, e.target.value)
                                    }
                                    className="flex-1 mr-2"
                                />
                                <Button
                                    variant="destructive"
                                    onClick={() => handleRemoveTag(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="secondary"
                            onClick={handleAddTag}
                            className="mt-2"
                        >
                            Add Tag
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditSampleModal;
