/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ChunkedFile {
    chunkIndex: number;
    totalChunks: number;
    data: ArrayBuffer;
    fileName: string;
}

const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB per chunk

// Split the file into chunks
export function splitFileIntoChunks(file: File): ChunkedFile[] {
    const chunks: ChunkedFile[] = [];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);

        const chunkData = file.slice(start, end);
        const reader = new FileReader();

        // Using promise for async file reading
        reader.readAsArrayBuffer(chunkData);
        const data = new Uint8Array(reader.result as ArrayBuffer);

        chunks.push({
            chunkIndex,
            totalChunks,
            data,
            fileName: file.name,
        });
    }
    return chunks;
}

// Check if the chunks are contiguous and complete
export function validateChunks(chunks: ChunkedFile[]): boolean {
    const chunkSet = new Set<number>();
    for (const chunk of chunks) {
        chunkSet.add(chunk.chunkIndex);
    }
    return chunkSet.size === chunks[0].totalChunks;
}
