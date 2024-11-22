/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import DonateButton from "@components/DonateButton";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { gitRemote } from "@shared/vencordUserAgent";
import { Margins } from "@utils/margins";
import { classes, identity } from "@utils/misc";
import { relaunch, showItemInFolder } from "@utils/native";
import { useAwaiter } from "@utils/react";
import { downloadSettingsBackup, uploadSettingsBackup } from "@utils/settingsSync";
import { Button, Card, Forms, React, Select, Switch } from "@webpack/common";

import { Flex, FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "..";
import { openNotificationSettingsModal } from "./NotificationSettings";
import { QuickAction, QuickActionCard } from "./quickActions";
import { SettingsTab, wrapTab } from "./shared";

const cl = classNameFactory("vc-settings-");

const DEFAULT_DONATE_IMAGE = "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/main/browser/icon.png";
const SHIGGY_DONATE_IMAGE = "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/main/browser/icon.png";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];


function MooncordSettings() {
    const [settingsDir, , settingsDirPending] = useAwaiter(VencordNative.settings.getSettingsDir, {
        fallbackValue: "Loading..."
    });
    const [themesDir, , themesDirPending] = useAwaiter(VencordNative.settings.getThemesDir, {
        fallbackValue: "Loading..."
    });
    const settings = useSettings();

    const donateImage = React.useMemo(() => Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE, []);

    const isWindows = navigator.platform.toLowerCase().startsWith("win");
    const isMac = navigator.platform.toLowerCase().startsWith("mac");
    const needsVibrancySettings = IS_DISCORD_DESKTOP && isMac;

    const Switches: Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        note: string;
    }> =
        [
            {
                key: "useQuickCss",
                title: "Enable Custom CSS",
                note: "Loads your Custom CSS"
            },
            !IS_WEB && {
                key: "enableReactDevtools",
                title: "Enable React Developer Tools",
                note: "Requires a full restart"
            },
            !IS_WEB && (!IS_DISCORD_DESKTOP || !isWindows ? {
                key: "frameless",
                title: "Disable the window frame",
                note: "Requires a full restart"
            } : {
                key: "winNativeTitleBar",
                title: "Use Windows' native title bar instead of Discord's custom one",
                note: "Requires a full restart"
            }),
            !IS_WEB && {
                key: "transparent",
                title: "Enable window transparency.",
                note: "You need a theme that supports transparency or this will do nothing. WILL STOP THE WINDOW FROM BEING RESIZABLE!! Requires a full restart"
            },
            !IS_WEB && isWindows && {
                key: "winCtrlQ",
                title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
                note: "Requires a full restart"
            },
            IS_DISCORD_DESKTOP && {
                key: "disableMinSize",
                title: "Disable minimum window size",
                note: "Requires a full restart"
            },
        ];


    /**
     * Downloads a file from a raw GitHub link and saves it to the user's local file system.
     * @param githubRawUrl The URL to the raw file on GitHub.
     * @param destinationFileName The name of the file to save in the default downloads directory.
     */
    async function useForceUpdater(githubRawUrl: string, destinationFileName?: string): Promise<void> {
        // Validate the URL
        try {
            new URL(githubRawUrl);
        } catch {
            throw new Error("Invalid GitHub URL provided.");
        }

        // Use a CORS proxy
        const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
        const response = await fetch(corsProxyUrl + githubRawUrl);

        // Check if the response is okay
        if (!response.ok) {
            throw new Error(`Failed to download file: Status code ${response.status}`);
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Use the provided destination file name or set a default
        if (!destinationFileName) {
            destinationFileName = "desktop.asar";
        }

        // Ensure the file name includes an appropriate extension
        const fileExtension = githubRawUrl.split(".").pop(); // Extracting extension from URL
        if (!destinationFileName.includes(".")) {
            destinationFileName += `.${fileExtension}`; // Add extension if missing
        }

        // Create a link element to download the file
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = destinationFileName; // Browser will handle the download

        // Append to the document and trigger a click to download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        // Alert user to move the file
        alert(`File downloaded as: ${destinationFileName}. Please move it to %APPDATA%\\Mooncord manually.`);
    }


    return (
        <SettingsTab title="Mooncord Settings">
            <DonateCard image={donateImage} />
            <Forms.FormSection title="Quick Actions">
                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text="Notification Log"
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="Edit QuickCSS"
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    {!IS_WEB && (
                        <QuickAction
                            Icon={RestartIcon}
                            text="Relaunch Discord"
                            action={relaunch}
                        />
                    )}
                    {!IS_WEB && (
                        <QuickAction
                            Icon={FolderIcon}
                            text="Open Settings Folder"
                            action={() => showItemInFolder(settingsDir)}
                        />
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text="View Source Code"
                        action={() => VencordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                    <QuickAction // added 2024.10.07 - open themes folder @PeaceOfficial
                        Icon={FolderIcon}
                        text="Open Themes Folder"
                        action={() => showItemInFolder(themesDir)}
                    />
                </QuickActionCard>
            </Forms.FormSection>

            <Forms.FormDivider />

            <Forms.FormSection className={Margins.top16} title="Settings" tag="h5">
                {/*                 <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Hint: You can change the position of this settings section in the
                    {" "}<Button
                        look={Button.Looks.BLANK}
                        style={{ color: "var(--text-link)", display: "inline-block" }}
                        onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}
                    >
                        settings of the Settings plugin
                    </Button>!
                </Forms.FormText> */}

                {Switches.map(s => s && (
                    <Switch
                        key={s.key}
                        value={settings[s.key]}
                        onChange={v => settings[s.key] = v}
                        note={s.note}
                    >
                        {s.title}
                    </Switch>
                ))}
            </Forms.FormSection>


            {needsVibrancySettings && <>
                <Forms.FormTitle tag="h5">Window vibrancy style (requires restart)</Forms.FormTitle>
                <Select
                    className={Margins.bottom20}
                    placeholder="Window vibrancy style"
                    options={[
                        // Sorted from most opaque to most transparent
                        {
                            label: "No vibrancy", value: undefined
                        },
                        {
                            label: "Under Page (window tinting)",
                            value: "under-page"
                        },
                        {
                            label: "Content",
                            value: "content"
                        },
                        {
                            label: "Window",
                            value: "window"
                        },
                        {
                            label: "Selection",
                            value: "selection"
                        },
                        {
                            label: "Titlebar",
                            value: "titlebar"
                        },
                        {
                            label: "Header",
                            value: "header"
                        },
                        {
                            label: "Sidebar",
                            value: "sidebar"
                        },
                        {
                            label: "Tooltip",
                            value: "tooltip"
                        },
                        {
                            label: "Menu",
                            value: "menu"
                        },
                        {
                            label: "Popover",
                            value: "popover"
                        },
                        {
                            label: "Fullscreen UI (transparent but slightly muted)",
                            value: "fullscreen-ui"
                        },
                        {
                            label: "HUD (Most transparent)",
                            value: "hud"
                        },
                    ]}
                    select={v => (settings.macosVibrancyStyle = v)}
                    isSelected={v => settings.macosVibrancyStyle === v}
                    serialize={identity} />
            </>}

            <Forms.FormSection className={Margins.top16} title="Mooncord Notifications" tag="h5">
                <Forms.FormSection className={Margins.bottom20}>
                    <Flex>
                        <Button onClick={openNotificationSettingsModal}>
                            Notification Settings
                        </Button>
                        <Button onClick={openNotificationLogModal}>
                            View Notification Log
                        </Button>
                    </Flex>
                </Forms.FormSection>
            </Forms.FormSection>

            <div style={{ marginTop: "25px" }}></div> {/* Spacer with specific margin */}

            <Forms.FormSection className={Margins.top16} title="Mooncord Backup & Recover" tag="h5">
                <Card className={classes("vc-settings-card", "vc-backup-restore-card")}>
                    <Flex flexDirection="column">

                        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                            <strong>Sharing settings inside Mooncord made simpler</strong>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                            <strong>⚠️ Information ⚠️</strong>
                        </div>

                        <div style={{ marginBottom: "16px", textAlign: "center" }}>
                            <span>Importing a settings file will overwrite your current settings.</span><br />
                            <span>Export contains: Custom QuickCSS, Theme Links, Plugin Settings.</span>
                        </div>

                        <div style={{ marginBottom: "8px", textAlign: "center" }}>
                            <span>Export and Import Mooncord settings as a "JSON" file.</span><br />
                            <span>Save with Export Settings & Load with Import Settings.</span>
                        </div>

                        <Button
                            onClick={() => downloadSettingsBackup()}
                        >
                            💾 Export Settings 💾
                        </Button>
                        <Button
                            onClick={() => uploadSettingsBackup()}
                        >
                            🚀 Import Settings 🚀
                        </Button>
                    </Flex>
                </Card>
            </Forms.FormSection>

            <div style={{ marginTop: "25px" }}></div> {/* Spacer with specific margin */}

            {<Forms.FormSection className={Margins.top16} title="Mooncord Updates" tag="h5">
                <Card className={classes("vc-settings-card", "vc-backup-restore-card")}>
                    <Flex flexDirection="column">

                        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                            <strong>Update inside Mooncord made simpler</strong>
                        </div>

                        <Button
                            onClick={() => useForceUpdater("https://github.com/PeaceOfficial/Mooncord/releases/download/RELEASE/desktop.asar", "desktop.asar")}
                        >
                            🚀 Update Mooncord 🚀
                        </Button>
                    </Flex>
                </Card>
            </Forms.FormSection>
            }


        </SettingsTab>
    );
}

interface DonateCardProps {
    image: string;
}

function DonateCard({ image }: DonateCardProps) {
    return (
        <Card className={cl("card", "donate")}>
            <div>
                <Forms.FormTitle tag="h5">Support the Project</Forms.FormTitle>
                <Forms.FormText>Please consider supporting the development of Mooncord by donating!</Forms.FormText>
                <DonateButton style={{ transform: "translateX(-1em)" }} />
            </div>
            <img
                role="presentation"
                src={image}
                alt=""
                height={128}
                style={{
                    imageRendering: image === SHIGGY_DONATE_IMAGE ? "pixelated" : void 0,
                    marginLeft: "auto",
                    transform: image === DEFAULT_DONATE_IMAGE ? "rotate(10deg)" : void 0
                }}
            />
        </Card>
    );
}

export default wrapTab(MooncordSettings, "Mooncord Settings");
