/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MooncordDevs } from "@utils/constants"; // Import necessary constants
import definePlugin from "@utils/types"; // Plugin type definition
import { ReactDOM } from "@webpack/common";

import FileUpload from "./components/FileUpload"; // Import the file upload component

export default definePlugin({
    name: "DiscordFileSplitter",
    description: "Splits large files into smaller chunks for manual upload to Discord.",
    tags: ["file", "upload", "split"],
    authors: [MooncordDevs.peaceofficial], // Replace with your appropriate author handle
    version: "1.0.0",
    main: "index.tsx", // Entry point of the plugin

    // The plugin's main execution logic, loading the file upload component
    start() {
        const rootElement = document.createElement("div");
        document.body.appendChild(rootElement);

        // Main component for rendering
        const App = () => {
            const handleUploadComplete = (fileName: string) => {
                console.log(`Upload completed for ${fileName}`);
                alert(`Upload completed for ${fileName}. Please manually upload the file parts.`);
            };

            return (
                <div>
                    <h1>Discord File Splitter</h1>
                    <FileUpload onUploadComplete={handleUploadComplete} />
                </div>
            );
        };

        // Render the React app within the created div
        ReactDOM.render(<App />, rootElement);
    },

    // Cleanup function when the plugin stops
    stop() {
        const rootElement = document.querySelector("div");
        if (rootElement) {
            ReactDOM.unmountComponentAtNode(rootElement);
            rootElement.remove();
        }
    }
});
