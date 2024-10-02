"use client";

import { useEffect, useMemo } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { normalize } from "@tauri-apps/api/path";

//

const DirectoryBreadcrumbs = ({
    onNewDirectory,
    currentDirectory,
}: {
    onNewDirectory: (dir: string) => void;
    currentDirectory: string;
}) => {
    const directories = useMemo(() => {
        const dirArray = currentDirectory.split("/").filter(Boolean); // Use filter to remove empty strings
        if (dirArray.length === 0 && currentDirectory !== "") {
            return [];
        }
        return dirArray;
    }, [currentDirectory]);

    return (
        <Breadcrumb className="flex flex-row gap-2">
            <BreadcrumbList>
                <BreadcrumbItem
                    className="capitalize hover:text-white cursor-pointer"
                    onClick={() => onNewDirectory("/")}
                >
                    Home
                </BreadcrumbItem>
                {directories.length > 0 ? <BreadcrumbSeparator /> : null}
                {directories.map((dir, index) => {
                    return (
                        <>
                            <BreadcrumbItem
                                className="capitalize hover:text-white cursor-pointer"
                                onClick={() =>
                                    onNewDirectory("/"+
                                        directories
                                            .slice(0, index + 1)
                                            .join("/")
                                    )
                                }
                                key={dir + index}
                            >
                                {dir}
                            </BreadcrumbItem>
                            {index < directories.length - 1 && ( // Add separator if it's not the last item
                                <BreadcrumbSeparator />
                            )}
                        </>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default DirectoryBreadcrumbs;
