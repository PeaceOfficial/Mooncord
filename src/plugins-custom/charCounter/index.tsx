/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MooncordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

// Define max lengths for various inputs
const maxLengths = {
    normal: 2000,
    customstatus: 128,
    popoutnote: 256,
    profilenote: 256,
    nick: 32, // Added nick length if needed
};

const typeMap = {
    normal: "chat",
    form: "upload",
    sidebar: "chat",
    thread_creation: "threadcreation",
    user_profile: "userprofile",
};

const nativeCounters = ["profile_bio_input"];

export default definePlugin({
    name: "CharCounter",
    description: "Adds a Character Counter to most Inputs",
    tags: ["input", "counter"],
    authors: [MooncordDevs.peaceofficial],

    start() {
        this.loadStyles(); // Load custom styles

        // Hook into necessary components
        this.patchComponents();
    },

    stop() {
        // Cleanup any patches or listeners
        this.unpatchComponents();
    },

    loadStyles() {
        const css = `
            .charcounter {
                position: relative !important;
                width: 100%;
            }
            .charcounter-counter {
                display: block;
                position: absolute;
                font-size: 15px;
                z-index: 10;
                pointer-events: none;
            }
            .charcounter-chat {
                right: 0;
                bottom: 0.3em;
            }
            .charcounter-edit {
                right: 0;
                bottom: -1.3em;
            }
            .charcounter-thread {
                right: 16px;
                bottom: 0.3em;
            }
            .charcounter-profile {
                right: 0;
                bottom: -1.3em;
                font-size: 12px;
            }
            .charcounter-customstatus {
                right: 0 !important;
                top: -1.5em;
            }
            .charcounter-popoutnote {
                right: 3px !important;
                bottom: -8px !important;
                font-size: 10px !important;
            }
            .charcounter-profilenote {
                right: 0 !important;
                bottom: -10px !important;
                font-size: 12px !important;
            }
            .textarea:not(:focus) ~ .charcounter-counter,
            .userpopoutouter .textareawrapall:not(:focus-within) ~ .charcounter-counter {
                display: none;
            }
        `;
        // Add CSS styles to the document
        document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
    },

    patchComponents() {
        // Example of how to hook into components
        // Replace this with actual component patching logic
        const observer = new MutationObserver(() => {
            this.checkForTextAreas();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },

    unpatchComponents() {
        // Unpatch any components and cleanup
    },

    checkForTextAreas() {
        // Check for text areas and inject counters
        const textAreas = document.querySelectorAll("textarea"); // Select all textareas
        textAreas.forEach(textarea => {
            if (!textarea.classList.contains("charcounter")) {
                this.injectCounter(textarea);
            }
        });
    },

    injectCounter(textarea: HTMLTextAreaElement) {
        const counterDiv = document.createElement("div");
        counterDiv.className = "charcounter-counter";
        const maxLength = maxLengths.normal; // Adjust as necessary
        counterDiv.innerText = `0/${maxLength}`; // Initial counter value
        textarea.parentElement?.insertBefore(counterDiv, textarea.nextSibling);

        textarea.addEventListener("input", () => {
            const currentLength = textarea.value.length;
            counterDiv.innerText = `${currentLength}/${maxLength}`;
            // Adjust visibility based on input length, if needed
        });
    },
});
