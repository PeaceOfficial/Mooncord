/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState } from "@webpack/common";
import { ChunkedFile, splitFileIntoChunks } from "plugins-user/FileUpload/components/chunkUtils";

interface FileUploadProps {
    onUploadComplete: (fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [chunks, setChunks] = useState<ChunkedFile[]>([]);
    const [chunkProgress, setChunkProgress] = useState(0);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSplitFile = () => {
        if (!selectedFile) return;

        // Split the file into chunks
        const fileChunks = splitFileIntoChunks(selectedFile);
        setChunks(fileChunks);
        setChunkProgress(0);
    };

    const handleChunkDownload = (chunk: ChunkedFile) => {
        const blob = new Blob([chunk.data], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = chunk.fileName;
        link.click();
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUploadComplete(selectedFile.name);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            {selectedFile && !chunks.length && (
                <button onClick={handleSplitFile}>Split and Upload {selectedFile.name}</button>
            )}

            {chunks.length > 0 && (
                <div>
                    <p>File split into {chunks.length} chunks. Please download and upload each part to Discord.</p>
                    <ul>
                        {chunks.map((chunk, index) => (
                            <li key={index}>
                                Chunk {chunk.chunkIndex + 1}/{chunk.totalChunks}
                                <button onClick={() => handleChunkDownload(chunk)}>Download {chunk.fileName}</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {chunks.length > 0 && (
                <div>
                    <button onClick={handleUpload}>Complete Upload</button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
