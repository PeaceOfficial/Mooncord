/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, Argument, CommandContext, sendBotMessage } from "@api/Commands";
import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Notices } from "@api/index";
import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { OpenExternalIcon } from "@components/Icons";
import { MooncordDevs } from "@utils/constants";
import { insertTextIntoChatInputBox } from "@utils/discord";
import { Margins } from "@utils/margins";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Button, DraftType, Forms, Menu, PermissionsBits, PermissionStore, React, Select, SelectedChannelStore, showToast, TextInput, UploadManager, useEffect, useState } from "@webpack/common";

const Native = VencordNative.pluginHelpers.BigFileUpload as PluginNative<typeof import("./native")>;

const UploadStore = findByPropsLazy("getUploads");
const OptionClasses = findByPropsLazy("optionName", "optionIcon", "optionLabel");

function createCloneableStore(initialState: any) {
    const store = { ...initialState };
    const listeners: (() => void)[] = [];

    function get() {
        return { ...store };
    }

    function set(newState: Partial<typeof store>) {
        Object.assign(store, newState);
        listeners.forEach(listener => listener());
    }

    function subscribe(listener: () => void) {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    return {
        get,
        set,
        subscribe
    };
}

function SettingsComponent(props: { setValue(v: any): void; }) {
    const [fileUploader, setFileUploader] = useState(settings.store.fileUploader || "GoFile");
    const [customUploaderStore] = useState(() => createCloneableStore({
        name: settings.store.customUploaderName || "",
        requestURL: settings.store.customUploaderRequestURL || "",
        fileFormName: settings.store.customUploaderFileFormName || "",
        responseType: settings.store.customUploaderResponseType || "",
        url: settings.store.customUploaderURL || "",
        thumbnailURL: settings.store.customUploaderThumbnailURL || "",
        headers: (() => {
            const parsedHeaders = JSON.parse(settings.store.customUploaderHeaders || "{}");
            if (Object.keys(parsedHeaders).length === 0) {
                parsedHeaders[""] = "";
            }
            return parsedHeaders;
        })(),
        args: (() => {
            const parsedArgs = JSON.parse(settings.store.customUploaderArgs || "{}");
            if (Object.keys(parsedArgs).length === 0) {
                parsedArgs[""] = "";
            }
            return parsedArgs;
        })(),
    }));

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = customUploaderStore.subscribe(() => {
            const state = customUploaderStore.get();
            updateSetting("customUploaderName", state.name);
            updateSetting("customUploaderRequestURL", state.requestURL);
            updateSetting("customUploaderFileFormName", state.fileFormName);
            updateSetting("customUploaderResponseType", state.responseType);
            updateSetting("customUploaderURL", state.url);
            updateSetting("customUploaderThumbnailURL", state.thumbnailURL);
            updateSetting("customUploaderHeaders", JSON.stringify(state.headers));
            updateSetting("customUploaderArgs", JSON.stringify(state.args));
        });

        return unsubscribe;
    }, []);

    function updateSetting(key: keyof typeof settings.store, value: any) {
        if (key in settings.store) {
            settings.store[key] = value;
        } else {
            console.error(`Invalid setting key: ${key}`);
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Invalid setting key: " + `${key}`,
                onClick: () => {
                    Notices.popNotice();
                }
            });
        }
    }

    function handleShareXConfigUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const config = JSON.parse(e.target?.result as string);

                    customUploaderStore.set({
                        name: "",
                        requestURL: "",
                        fileFormName: "",
                        responseType: "Text",
                        url: "",
                        thumbnailURL: "",
                        headers: { "": "" },
                        args: { "": "" }
                    });

                    customUploaderStore.set({
                        name: config.Name || "",
                        requestURL: config.RequestURL || "",
                        fileFormName: config.FileFormName || "",
                        responseType: config.ResponseType || "Text",
                        url: config.URL || "",
                        thumbnailURL: config.ThumbnailURL || "",
                        headers: config.Headers || { "": "" },
                        args: config.Arguments || { "": "" }
                    });

                    updateSetting("customUploaderName", config.Name || "");
                    updateSetting("customUploaderRequestURL", config.RequestURL || "");
                    updateSetting("customUploaderFileFormName", config.FileFormName || "");
                    updateSetting("customUploaderResponseType", config.ResponseType || "Text");
                    updateSetting("customUploaderURL", config.URL || "");
                    updateSetting("customUploaderThumbnailURL", config.ThumbnailURL || "");
                    updateSetting("customUploaderHeaders", JSON.stringify(config.Headers || { "": "" }));
                    updateSetting("customUploaderArgs", JSON.stringify(config.Arguments || { "": "" }));

                    setFileUploader("Custom");
                    updateSetting("fileUploader", "Custom");

                    showToast("ShareX config imported successfully!");
                } catch (error) {
                    console.error("Error parsing ShareX config:", error);
                    showNotification({
                        title: "Notification: BigFileUpload - Plugin",
                        body: "Error parsing ShareX config: " + `${error}`,
                        onClick: () => {
                            Notices.popNotice();
                        }
                    });
                    showToast("Error importing ShareX config. Check console for details.");
                }
            };
            reader.readAsText(file);

            event.target.value = "";
        }
    }

    const validateCustomUploaderSettings = () => {
        if (fileUploader === "Custom") {
            if (!settings.store.customUploaderRequestURL) {
                showToast("Custom uploader request URL is required.");
                return false;
            }
            if (!settings.store.customUploaderFileFormName) {
                showToast("Custom uploader file form name is required.");
                return false;
            }
            if (!settings.store.customUploaderURL) {
                showToast("Custom uploader URL (JSON path) is required.");
                return false;
            }
        }
        return true;
    };

    const handleFileUploaderChange = (v: string) => {
        if (v === "Custom" && !validateCustomUploaderSettings()) {
            return;
        }
        setFileUploader(v);
        updateSetting("fileUploader", v);
    };

    const handleArgChange = (oldKey: string, newKey: string, value: any) => {
        const state = customUploaderStore.get();
        const newArgs = { ...state.args };

        if (oldKey !== newKey) {
            delete newArgs[oldKey];
        }

        if (value === "" && newKey === "") {
            delete newArgs[oldKey];
        } else {
            newArgs[newKey] = value;
        }

        customUploaderStore.set({ args: newArgs });

        if (Object.values(newArgs).every(v => v !== "") && Object.keys(newArgs).every(k => k !== "")) {
            newArgs[""] = "";
        }

        customUploaderStore.set({ args: newArgs });
    };

    const handleHeaderChange = (oldKey: string, newKey: string, value: string) => {
        const state = customUploaderStore.get();
        const newHeaders = { ...state.headers };

        if (oldKey !== newKey) {
            delete newHeaders[oldKey];
        }

        if (value === "" && newKey === "") {
            delete newHeaders[oldKey];
        } else {
            newHeaders[newKey] = value;
        }

        customUploaderStore.set({ headers: newHeaders });

        if (Object.values(newHeaders).every(v => v !== "") && Object.keys(newHeaders).every(k => k !== "")) {
            newHeaders[""] = "";
        }

        customUploaderStore.set({ headers: newHeaders });
    };

    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <Flex flexDirection="column">
            {/* File Uploader Selection */}
            <Forms.FormSection title="Select the file uploader service">
                <Select
                    options={[
                        { label: "Custom Uploader", value: "Custom" },
                        { label: "Catbox", value: "Catbox" },
                        { label: "Litterbox", value: "Litterbox" },
                        { label: "GoFile", value: "GoFile" },
                    ]}
                    placeholder="Select the file uploader service"
                    className={Margins.bottom16}
                    select={handleFileUploaderChange}
                    isSelected={v => v === fileUploader}
                    serialize={v => v}
                />
            </Forms.FormSection>

            {/* Catbox Settings */}
            {fileUploader === "Catbox" && (
                <>
                    <Forms.FormDivider />
                    <Forms.FormTitle>Catbox Settings</Forms.FormTitle>
                    <Forms.FormSection title="Catbox User hash (optional)">
                        <TextInput
                            type="text"
                            value={settings.store.catboxUserHash || ""}
                            placeholder="Insert User Hash"
                            onChange={newValue => updateSetting("catboxUserHash", newValue)}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>
                </>
            )}

            {/* Litterbox Settings */}
            {fileUploader === "Litterbox" && (
                <>
                    <Forms.FormDivider />
                    <Forms.FormTitle>Litterbox Settings</Forms.FormTitle>
                    <Forms.FormSection title="Select the file expiration time">
                        <Select
                            options={[
                                { label: "1 hour", value: "1h" },
                                { label: "12 hours", value: "12h" },
                                { label: "24 hours", value: "24h" },
                                { label: "72 hours", value: "72h" },
                            ]}
                            placeholder="Select Duration"
                            className={Margins.bottom16}
                            select={newValue => updateSetting("litterboxTime", newValue)}
                            isSelected={v => v === settings.store.litterboxTime}
                            serialize={v => v}
                        />
                    </Forms.FormSection>
                </>
            )}

            {/* Custom Uploader Settings */}
            {fileUploader === "Custom" && (
                <>
                    <Forms.FormSection title="Name of the custom uploader">
                        <TextInput
                            type="text"
                            value={customUploaderStore.get().name}
                            placeholder="Name"
                            onChange={(newValue: string) => customUploaderStore.set({ name: newValue })}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>

                    <Forms.FormSection title="Request URL for the custom uploader">
                        <TextInput
                            type="text"
                            value={customUploaderStore.get().requestURL}
                            placeholder="Request URL"
                            onChange={(newValue: string) => customUploaderStore.set({ requestURL: newValue })}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>

                    <Forms.FormSection title="File form name for the custom uploader">
                        <TextInput
                            type="text"
                            value={customUploaderStore.get().fileFormName}
                            placeholder="File Form Name"
                            onChange={(newValue: string) => customUploaderStore.set({ fileFormName: newValue })}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>

                    <Forms.FormSection title="Response type for the custom uploader">
                        <Select
                            options={[
                                { label: "Text", value: "Text" },
                                { label: "JSON", value: "JSON" },
                            ]}
                            placeholder="Select Response Type"
                            className={Margins.bottom16}
                            select={(newValue: string) => customUploaderStore.set({ responseType: newValue })}
                            isSelected={(v: string) => v === customUploaderStore.get().responseType}
                            serialize={(v: string) => v}
                        />
                    </Forms.FormSection>

                    <Forms.FormSection title="URL (JSON path) for the custom uploader">
                        <TextInput
                            type="text"
                            value={customUploaderStore.get().url}
                            placeholder="URL (JSON path)"
                            onChange={(newValue: string) => customUploaderStore.set({ url: newValue })}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>

                    <Forms.FormSection title="Thumbnail URL (JSON path) for the custom uploader">
                        <TextInput
                            type="text"
                            value={customUploaderStore.get().thumbnailURL}
                            placeholder="Thumbnail URL (JSON path)"
                            onChange={(newValue: string) => customUploaderStore.set({ thumbnailURL: newValue })}
                            className={Margins.bottom16}
                        />
                    </Forms.FormSection>

                    <Forms.FormDivider />
                    <Forms.FormTitle>Custom Uploader Arguments</Forms.FormTitle>
                    {Object.entries(customUploaderStore.get().args).map(([key, value], index) => (
                        <div key={index}>
                            <TextInput
                                type="text"
                                value={key}
                                placeholder="Argument Key"
                                onChange={(newKey: string) => handleArgChange(key, newKey, value as string)}
                                className={Margins.bottom16}
                            />
                            <TextInput
                                type="text"
                                value={value as string}
                                placeholder="Argument Value"
                                onChange={(newValue: string) => handleArgChange(key, key, newValue)}
                                className={Margins.bottom16}
                            />
                        </div>
                    ))}

                    <Forms.FormDivider />
                    <Forms.FormTitle>Headers</Forms.FormTitle>
                    {Object.entries(customUploaderStore.get().headers).map(([key, value], index) => (
                        <div key={index}>
                            <TextInput
                                type="text"
                                value={key}
                                placeholder="Header Key"
                                onChange={(newKey: string) => handleHeaderChange(key, newKey, value as string)}
                                className={Margins.bottom16}
                            />
                            <TextInput
                                type="text"
                                value={value as string}
                                placeholder="Header Value"
                                onChange={(newValue: string) => handleHeaderChange(key, key, newValue)}
                                className={Margins.bottom16}
                            />
                        </div>
                    ))}

                    <Forms.FormDivider />
                    <Forms.FormTitle>Import ShareX Config</Forms.FormTitle>
                    <Button
                        onClick={triggerFileUpload}
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.XLARGE}
                        className={Margins.bottom16}
                    >
                        Select File
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sxcu"
                        style={{ display: "none" }}
                        onChange={handleShareXConfigUpload}
                    />
                </>
            )}
        </Flex>
    );
}

const settings = definePluginSettings({
    fileUploader: {
        type: OptionType.SELECT,
        options: [
            { label: "Custom Uploader", value: "Custom" },
            { label: "Catbox", value: "Catbox", default: true },
            { label: "Litterbox", value: "Litterbox" },
            { label: "GoFile", value: "GoFile" },
        ],
        description: "Select the file uploader service",
        hidden: true
    },
    catboxUserHash: {
        type: OptionType.STRING,
        default: "",
        description: "User hash for Catbox uploader (optional)",
        hidden: true
    },
    litterboxTime: {
        type: OptionType.SELECT,
        options: [
            { label: "1 hour", value: "1h", default: true },
            { label: "12 hours", value: "12h" },
            { label: "24 hours", value: "24h" },
            { label: "72 hours", value: "72h" },
        ],
        description: "Duration for files on Litterbox before they are deleted",
        hidden: true
    },
    customUploaderName: {
        type: OptionType.STRING,
        default: "",
        description: "Name of the custom uploader",
        hidden: true
    },
    customUploaderRequestURL: {
        type: OptionType.STRING,
        default: "",
        description: "Request URL for the custom uploader",
        hidden: true
    },
    customUploaderFileFormName: {
        type: OptionType.STRING,
        default: "",
        description: "File form name for the custom uploader",
        hidden: true
    },
    customUploaderResponseType: {
        type: OptionType.SELECT,
        options: [
            { label: "Text", value: "Text", default: true },
            { label: "JSON", value: "JSON" },
        ],
        description: "Response type for the custom uploader",
        hidden: true
    },
    customUploaderURL: {
        type: OptionType.STRING,
        default: "",
        description: "URL (JSON path) for the custom uploader",
        hidden: true
    },
    customUploaderThumbnailURL: {
        type: OptionType.STRING,
        default: "",
        description: "Thumbnail URL (JSON path) for the custom uploader",
        hidden: true
    },
    customUploaderHeaders: {
        type: OptionType.STRING,
        default: JSON.stringify({}),
        description: "Headers for the custom uploader (JSON string)",
        hidden: true
    },
    customUploaderArgs: {
        type: OptionType.STRING,
        default: JSON.stringify({}),
        description: "Arguments for the custom uploader (JSON string)",
        hidden: true
    },
    customSettings: {
        type: OptionType.COMPONENT,
        component: SettingsComponent,
        description: "Configure custom uploader settings",
        hidden: false
    },
}).withPrivateSettings<{
    customUploaderArgs?: Record<string, string>;
    customUploaderHeaders?: Record<string, string>;
}>();

async function resolveFile(options: Argument[], ctx: CommandContext): Promise<File | null> {
    for (const opt of options) {
        if (opt.name === "file") {
            const upload = UploadStore.getUpload(ctx.channel.id, opt.name, DraftType.SlashCommand);
            return upload.item.file;
        }
    }
    return null;
}

async function uploadFileToGofile(file: File, channelId: string) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = file.name;
        const fileType = file.type;

        const serverResponse = await fetch("https://api.gofile.io/servers");
        const serverData = await serverResponse.json();
        const server = serverData.data.servers[Math.floor(Math.random() * serverData.data.servers.length)].name;

        const uploadResult = await Native.uploadFileToGofileNative(`https://${server}.gofile.io/uploadFile`, arrayBuffer, fileName, fileType);

        if (uploadResult.status === "ok") {
            const { downloadPage } = uploadResult.data;
            setTimeout(() => insertTextIntoChatInputBox(`${downloadPage} `), 10);
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        } else {
            console.error("Error uploading file:", uploadResult);
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Error uploading file: " + `${uploadResult}`,
                onClick: () => {
                    Notices.popNotice();
                }
            });
            sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        showNotification({
            title: "Notification: BigFileUpload - Plugin",
            body: "Error uploading file: " + `${error}`,
            onClick: () => {
                Notices.popNotice();
            }
        });
        sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
        UploadManager.clearAll(channelId, DraftType.SlashCommand);
    }
}

async function uploadFileToCatbox(file: File, channelId: string) {
    try {
        const url = "https://catbox.moe/user/api.php";
        const userHash = settings.store.catboxUserHash;
        const fileSizeMB = file.size / (1024 * 1024);

        const arrayBuffer = await file.arrayBuffer();
        const fileName = file.name;

        const uploadResult = await Native.uploadFileToCatboxNative(url, arrayBuffer, fileName, file.type, userHash);

        if (uploadResult.startsWith("https://") || uploadResult.startsWith("http://")) {
            const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".3gp", ".ogv"];
            let finalUrl = uploadResult;

            if (fileSizeMB >= 150 && videoExtensions.some(ext => finalUrl.endsWith(ext))) {
                finalUrl = `https://embeds.video/${finalUrl}`;
            }

            setTimeout(() => insertTextIntoChatInputBox(`${finalUrl} `), 10);
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        } else {
            console.error("Error uploading file:", uploadResult);
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Error uploading file: " + `${uploadResult}`,
                onClick: () => {
                    Notices.popNotice();
                }
            });
            sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        showNotification({
            title: "Notification: BigFileUpload - Plugin",
            body: "Error uploading file: " + `${error}`,
            onClick: () => {
                Notices.popNotice();
            }
        });
        sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
        UploadManager.clearAll(channelId, DraftType.SlashCommand);
    }
}

async function uploadFileToLitterbox(file: File, channelId: string) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = file.name;
        const fileType = file.type;
        const fileSizeMB = file.size / (1024 * 1024);
        const time = settings.store.litterboxTime;

        const uploadResult = await Native.uploadFileToLitterboxNative(arrayBuffer, fileName, fileType, time);

        if (uploadResult.startsWith("https://") || uploadResult.startsWith("http://")) {
            const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".3gp", ".ogv"];
            let finalUrl = uploadResult;

            if (fileSizeMB >= 150 && videoExtensions.some(ext => finalUrl.endsWith(ext))) {
                finalUrl = `https://embeds.video/${finalUrl}`;
            }

            setTimeout(() => insertTextIntoChatInputBox(`${finalUrl}`), 10);
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        } else {
            console.error("Error uploading file:", uploadResult);
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Error uploading file: " + `${uploadResult}`,
                onClick: () => {
                    Notices.popNotice();
                }
            });
            sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        showNotification({
            title: "Notification: BigFileUpload - Plugin",
            body: "Error uploading file: " + `${error}`,
            onClick: () => {
                Notices.popNotice();
            }
        });
        sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
        UploadManager.clearAll(channelId, DraftType.SlashCommand);
    }
}

async function uploadFileCustom(file: File, channelId: string) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = file.name;
        const fileType = file.type;

        const fileFormName = settings.store.customUploaderFileFormName || "file[]";
        const customArgs = JSON.parse(settings.store.customUploaderArgs || "{}");
        const customHeaders = JSON.parse(settings.store.customUploaderHeaders || "{}");
        const responseType = settings.store.customUploaderResponseType;
        const urlPath = settings.store.customUploaderURL.split(".");

        const finalUrl = await Native.uploadFileCustomNative(settings.store.customUploaderRequestURL, arrayBuffer, fileName, fileType, fileFormName, customArgs, customHeaders, responseType, urlPath);

        if (finalUrl.startsWith("https://") || finalUrl.startsWith("http://")) {
            const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".3gp", ".ogv"];
            let finalUrlModified = finalUrl;

            if (videoExtensions.some(ext => finalUrlModified.endsWith(ext))) {
                finalUrlModified = `https://embeds.video/${finalUrlModified}`;
            }

            setTimeout(() => insertTextIntoChatInputBox(`${finalUrlModified} `), 10);
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        } else {
            console.error("Error uploading file: Invalid URL returned");
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Error uploading file. Check the console for more info.",
                onClick: () => {
                    Notices.popNotice();
                }
            });
            sendBotMessage(channelId, { content: "Error uploading file. Check the console for more info." });
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        showNotification({
            title: "Notification: BigFileUpload - Plugin",
            body: "Error uploading file: " + `${error}`,
            onClick: () => {
                Notices.popNotice();
            }
        });
        sendBotMessage(channelId, { content: `Error uploading file: ${error}. Check the console for more info.` });
        UploadManager.clearAll(channelId, DraftType.SlashCommand);
    }
}

async function uploadFile(file: File, channelId: string) {
    const uploader = settings.store.fileUploader;
    switch (uploader) {
        case "GoFile":
            await uploadFileToGofile(file, channelId);
            break;
        case "Catbox":
            await uploadFileToCatbox(file, channelId);
            break;
        case "Litterbox":
            await uploadFileToLitterbox(file, channelId);
            break;
        case "Custom":
            await uploadFileCustom(file, channelId);
            break;
        default:
            console.error("Unknown uploader:", uploader);
            showNotification({
                title: "Notification: BigFileUpload - Plugin",
                body: "Error: Unknown uploader selected.",
                onClick: () => {
                    Notices.popNotice();
                }
            });
            sendBotMessage(channelId, { content: "Error: Unknown uploader selected." });
            UploadManager.clearAll(channelId, DraftType.SlashCommand);
    }
}

function triggerFileUpload() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";

    showNotification({
        title: "Notification: BigFileUpload - Plugin",
        body: "Please choose your specified file to upload...",
        onClick: () => {
            Notices.popNotice();
        }
    });

    fileInput.onchange = async event => {
        const target = event.target as HTMLInputElement;
        if (target && target.files && target.files.length > 0) {
            const file = target.files[0];
            if (file) {
                showNotification({
                    title: "Notification: BigFileUpload - Plugin",
                    body: "Upload Finished!",
                    onClick: () => {
                        Notices.popNotice();
                    }
                });
                const channelId = SelectedChannelStore.getChannelId();
                await uploadFile(file, channelId);
            } else {
                showToast("No file selected");
            }
        }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

const ctxMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    if (props.channel.guild_id && !PermissionStore.can(PermissionsBits.SEND_MESSAGES, props.channel)) return;

    children.splice(1, 0,
        <Menu.MenuItem
            id="upload-big-file"
            label={
                <div className={OptionClasses.optionLabel}>
                    <OpenExternalIcon className={OptionClasses.optionIcon} height={24} width={24} />
                    <div className={OptionClasses.optionName}>Upload a Big File</div>
                </div>
            }
            action={triggerFileUpload}
        />
    );
};

export default definePlugin({
    name: "BigFileUpload",
    description: "Bypass Discord's upload limit by uploading files using the 'Upload a Big File' button or /fileupload and they'll get uploaded as links into chat via file uploaders.",
    authors: [MooncordDevs.peaceofficial],
    settings,
    dependencies: ["CommandsAPI"],
    contextMenus: {
        "channel-attach": ctxMenuPatch,
    },
    commands: [
        {
            inputType: ApplicationCommandInputType.BUILT_IN,
            name: "fileupload",
            description: "Upload a file",
            options: [
                {
                    name: "file",
                    description: "The file to upload",
                    type: ApplicationCommandOptionType.ATTACHMENT,
                    required: true,
                },
            ],
            // Todo.: this should be the message to send: `The file has been uploaded: ||(${file})||`
            execute: async (opts, cmdCtx) => {
                // Notify the user before uploading the file
                sendBotMessage(cmdCtx.channel.id, { content: "Preparing to upload the file..." });

                const file = await resolveFile(opts, cmdCtx);

                if (file) {
                    // Notify the user that the file upload is starting
                    sendBotMessage(cmdCtx.channel.id, { content: "Uploading the file..." });
                    // Upload the file
                    await uploadFile(file, cmdCtx.channel.id); // Upload the file
                    // Notify the user after the upload completes
                    sendBotMessage(cmdCtx.channel.id, { content: "File upload completed successfully!" });
                } else {
                    // If no file is specified, show a notification
                    showNotification({
                        title: "Notification: BigFileUpload - Plugin",
                        body: "No file specified!",
                        onClick: () => {
                            Notices.popNotice();
                        }
                    });
                    // Send a bot message indicating that no file was specified
                    sendBotMessage(cmdCtx.channel.id, { content: "No file specified!" });
                    // Clear the upload manager
                    UploadManager.clearAll(cmdCtx.channel.id, DraftType.SlashCommand);
                }
            },

        },
    ],
});