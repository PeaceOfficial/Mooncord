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

import "./themesStyles.css";

import { Settings, useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Flex } from "@components/Flex";
import { CogWheel, DeleteIcon, FolderIcon, PaintbrushIcon, PencilIcon, PluginIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { AddonCard } from "@components/VencordSettings/AddonCard";
import { QuickAction, QuickActionCard } from "@components/VencordSettings/quickActions";
import { SettingsTab, wrapTab } from "@components/VencordSettings/shared";
import { isPluginEnabled } from "@plugins";
import { openInviteModal } from "@utils/discord";
import { openModal } from "@utils/modal";
import { showItemInFolder } from "@utils/native";
import { useAwaiter } from "@utils/react";
import type { ThemeHeader } from "@utils/themes";
import { getThemeInfo, stripBOM, type UserThemeHeader } from "@utils/themes/bd";
import { usercssParse } from "@utils/themes/usercss";
import { findLazy } from "@webpack";
import { Button, Card, Forms, React, showToast, TabBar, TextInput, Tooltip, useEffect, useMemo, useRef, useState } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";
import type { UserstyleHeader } from "usercss-meta";

import Plugins from "~plugins";

import { UserCSSSettingsModal } from "./UserCSSModal";

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;
const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

const cl = classNameFactory("vc-settings-theme-");

function Validator({ link, onValidate }: { link: string; onValidate: (valid: boolean) => void; }) {
    const [res, err, pending] = useAwaiter(() => fetch(link).then(res => {
        if (res.status > 300) throw `${res.status} ${res.statusText}`;
        const contentType = res.headers.get("Content-Type");
        if (!contentType?.startsWith("text/css") && !contentType?.startsWith("text/plain")) {
            onValidate(false);
            throw "Not a CSS file. Remember to use the raw link!";
        }

        onValidate(true);
        return "Okay!";
    }));

    const text = pending
        ? "Checking..."
        : err
            ? `Error: ${err instanceof Error ? err.message : String(err)}`
            : "Valid!";

    return <Forms.FormText style={{
        color: pending ? "var(--text-muted)" : err ? "var(--text-danger)" : "var(--text-positive)"
    }}>{text}</Forms.FormText>;
}

interface OtherThemeCardProps {
    theme: UserThemeHeader;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    onDelete: () => void;
    showDeleteButton?: boolean;
}

interface UserCSSCardProps {
    theme: UserstyleHeader;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    onDelete: () => void;
    onSettingsReset: () => void;
}

function UserCSSThemeCard({ theme, enabled, onChange, onDelete, onSettingsReset }: UserCSSCardProps) {
    const missingPlugins = useMemo(() =>
        theme.requiredPlugins?.filter(p => !isPluginEnabled(p)), [theme]);

    return (
        <AddonCard
            name={theme.name ?? "Unknown"}
            description={theme.description}
            author={theme.author ?? "Unknown"}
            enabled={enabled}
            setEnabled={onChange}
            disabled={missingPlugins && missingPlugins.length > 0}
            infoButton={
                <>
                    {missingPlugins && missingPlugins.length > 0 && (
                        <Tooltip text={"The following plugins are required, but aren't enabled: " + missingPlugins.join(", ")}>
                            {({ onMouseLeave, onMouseEnter }) => (
                                <div
                                    style={{ color: "var(--status-danger" }}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                >
                                    <PluginIcon />
                                </div>
                            )}
                        </Tooltip>
                    )}
                    {theme.vars && (
                        <div style={{ cursor: "pointer" }} onClick={
                            () => openModal(modalProps =>
                                <UserCSSSettingsModal modalProps={modalProps} theme={theme} onSettingsReset={onSettingsReset} />)
                        }>
                            <CogWheel />
                        </div>
                    )}
                    {IS_WEB && (
                        <div style={{ cursor: "pointer", color: "var(--status-danger" }} onClick={onDelete}>
                            <DeleteIcon />
                        </div>
                    )}
                </>
            }
            footer={
                <Flex flexDirection="row" style={{ gap: "0.2em" }}>
                    {!!theme.homepageURL && <Link href={theme.homepageURL}>Homepage</Link>}
                    {!!(theme.homepageURL && theme.supportURL) && " • "}
                    {!!theme.supportURL && <Link href={theme.supportURL}>Support</Link>}
                </Flex>
            }
        />
    );
}

function OtherThemeCard({ theme, enabled, onChange, onDelete, showDeleteButton }: OtherThemeCardProps) {
    return (
        <AddonCard
            name={theme.name}
            description={theme.description}
            author={theme.author}
            enabled={enabled}
            setEnabled={onChange}
            infoButton={
                (IS_WEB || showDeleteButton) && (
                    <div style={{ cursor: "pointer", color: "var(--status-danger" }} onClick={onDelete}>
                        <DeleteIcon />
                    </div>
                )
            }
            footer={
                <Flex flexDirection="row" style={{ gap: "0.2em" }}>
                    {!!theme.website && <Link href={theme.website}>Website</Link>}
                    {!!(theme.website && theme.invite) && " • "}
                    {!!theme.invite && (
                        <Link
                            href={`https://discord.gg/${theme.invite}`}
                            onClick={async e => {
                                e.preventDefault();
                                theme.invite != null && openInviteModal(theme.invite).catch(() => showToast("Invalid or expired invite"));
                            }}
                        >
                            Discord Server
                        </Link>
                    )}
                </Flex>
            }
        />
    );
}

enum ThemeTab {
    LOCAL,
    ONLINE
}

function ThemesTab() {
    const settings = useSettings(["themeLinks", "enabledThemeLinks", "enabledThemes"]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentTab, setCurrentTab] = useState(ThemeTab.LOCAL);
    const [currentThemeLink, setCurrentThemeLink] = useState("");
    const [themeLinkValid, setThemeLinkValid] = useState(false);
    const [userThemes, setUserThemes] = useState<ThemeHeader[] | null>(null);
    const [onlineThemes, setOnlineThemes] = useState<(UserThemeHeader & { link: string; })[] | null>(null);
    const [themeDir, , themeDirPending] = useAwaiter(VencordNative.themes.getThemesDir);

    useEffect(() => {
        refreshLocalThemes();
        refreshOnlineThemes();
    }, []);

    async function refreshLocalThemes() {
        const themes = await VencordNative.themes.getThemesList();
        const themeInfo: ThemeHeader[] = [];

        for (const { fileName, content } of themes) {
            if (!fileName.endsWith(".css")) continue;

            if ((!IS_WEB || "armcord" in window) && fileName.endsWith(".user.css")) {
                // handle it as usercss
                const header = await usercssParse(content, fileName);

                themeInfo.push({
                    type: "usercss",
                    header
                });

                Settings.userCssVars[header.id] ??= {};

                for (const [name, varInfo] of Object.entries(header.vars ?? {})) {
                    let normalizedValue = "";

                    switch (varInfo.type) {
                        case "text":
                        case "color":
                        case "checkbox":
                            normalizedValue = varInfo.default;
                            break;
                        case "select":
                            normalizedValue = varInfo.options.find(v => v.name === varInfo.default)!.value;
                            break;
                        case "range":
                            normalizedValue = `${varInfo.default}${varInfo.units}`;
                            break;
                        case "number":
                            normalizedValue = String(varInfo.default);
                            break;
                    }

                    Settings.userCssVars[header.id][name] ??= normalizedValue;
                }
            } else {
                // presumably BD but could also be plain css
                themeInfo.push({
                    type: "other",
                    header: getThemeInfo(stripBOM(content), fileName)
                });
            }
        }

        setUserThemes(themeInfo);
    }

    // When a local theme is enabled/disabled, update the settings
    function onLocalThemeChange(fileName: string, value: boolean) {
        if (value) {
            if (settings.enabledThemes.includes(fileName)) return;
            settings.enabledThemes = [...settings.enabledThemes, fileName];
        } else {
            settings.enabledThemes = settings.enabledThemes.filter(f => f !== fileName);
        }
    }

    async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
        e.stopPropagation();
        e.preventDefault();
        if (!e.currentTarget?.files?.length) return;
        const { files } = e.currentTarget;

        const uploads = Array.from(files, file => {
            const { name } = file;
            if (!name.endsWith(".css")) return;

            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    VencordNative.themes.uploadTheme(name, reader.result as string)
                        .then(resolve)
                        .catch(reject);
                };
                reader.readAsText(file);
            });
        });

        await Promise.all(uploads);
        refreshLocalThemes();
    }

    function LocalThemes() {
        return (
            <>
                <Card className="vc-settings-card">
                    <Forms.FormTitle tag="h5">Find Themes:</Forms.FormTitle>
                    <div style={{ marginBottom: ".5em", display: "flex", flexDirection: "column" }}>
                        <Link style={{ marginRight: ".5em" }} href="https://betterdiscord.app/themes">
                            BetterDiscord Themes
                        </Link>
                        <Link href="https://github.com/search?q=discord+theme">GitHub</Link>
                    </div>
                    <Forms.FormText>If using the BD site, click on "Download" and place the downloaded .theme.css file into your themes folder.</Forms.FormText>
                </Card>

                <Forms.FormSection title="Local Themes">
                    <QuickActionCard>
                        <>
                            {IS_WEB ?
                                (
                                    <QuickAction
                                        text={
                                            <span style={{ position: "relative" }}>
                                                Upload Theme
                                                <FileInput
                                                    ref={fileInputRef}
                                                    onChange={onFileUpload}
                                                    multiple={true}
                                                    filters={[{ extensions: ["css"] }]}
                                                />
                                            </span>
                                        }
                                        Icon={PlusIcon}
                                    />
                                ) : (
                                    <QuickAction
                                        text="Open Themes Folder"
                                        action={() => showItemInFolder(themeDir!)}
                                        disabled={themeDirPending}
                                        Icon={FolderIcon}
                                    />
                                )}
                            <QuickAction
                                text="Load missing Themes"
                                action={refreshLocalThemes}
                                Icon={RestartIcon}
                            />
                            <QuickAction
                                text="Edit QuickCSS"
                                action={() => VencordNative.quickCss.openEditor()}
                                Icon={PaintbrushIcon}
                            />

                            {Settings.plugins.ClientTheme.enabled && (
                                <QuickAction
                                    text="Edit ClientTheme"
                                    action={() => openPluginModal(Plugins.ClientTheme)}
                                    Icon={PencilIcon}
                                />
                            )}
                        </>
                    </QuickActionCard>

                    <div className={cl("grid")}>
                        {userThemes?.map(({ type, header: theme }: ThemeHeader) => (
                            type === "other" ? (
                                <OtherThemeCard
                                    key={theme.fileName}
                                    enabled={settings.enabledThemes.includes(theme.fileName)}
                                    onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                                    onDelete={async () => {
                                        onLocalThemeChange(theme.fileName, false);
                                        await VencordNative.themes.deleteTheme(theme.fileName);
                                        refreshLocalThemes();
                                    }}
                                    theme={theme as UserThemeHeader}
                                />
                            ) : (
                                <UserCSSThemeCard
                                    key={theme.fileName}
                                    enabled={settings.enabledThemes.includes(theme.fileName)}
                                    onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                                    onDelete={async () => {
                                        onLocalThemeChange(theme.fileName, false);
                                        await VencordNative.themes.deleteTheme(theme.fileName);
                                        refreshLocalThemes();
                                    }}
                                    onSettingsReset={refreshLocalThemes}
                                    theme={theme as UserstyleHeader}
                                />
                            )))}
                    </div>
                </Forms.FormSection>
            </>
        );
    }

    function addThemeLink(link: string) {
        if (!themeLinkValid) return;
        if (settings.themeLinks.includes(link)) return;

        settings.themeLinks = [...settings.themeLinks, link];
        setCurrentThemeLink("");
        refreshOnlineThemes();
    }

    async function refreshOnlineThemes() {
        const themes = await Promise.all(settings.themeLinks.map(async link => {
            const css = await fetch(link).then(res => res.text());
            return { ...getThemeInfo(css, link), link };
        }));
        setOnlineThemes(themes);
    }

    function onThemeLinkEnabledChange(link: string, enabled: boolean) {
        if (enabled) {
            if (settings.enabledThemeLinks.includes(link)) return;
            settings.enabledThemeLinks = [...settings.enabledThemeLinks, link];
        } else {
            settings.enabledThemeLinks = settings.enabledThemeLinks.filter(f => f !== link);
        }
    }

    function deleteThemeLink(link: string) {
        settings.themeLinks = settings.themeLinks.filter(f => f !== link);
        refreshOnlineThemes();
    }

    const predefinedThemes = [
        {
            fileName: "default-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/default-theme.css",
            name: "Mooncord - Default Theme",
            author: "PEACE",
            description: "Original dark rounded appearance of Mooncord.",
        },
        {
            fileName: "amaryllis-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/amaryllis-theme.css",
            name: "Mooncord - Amaryllis Theme",
            author: "PEACE",
            description: "Soft hues of gentle rose pink blend with deep dark midnight black colors."
        },
        {
            fileName: "biscuit-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/biscuit-theme.css",
            name: "Mooncord - Biscuit Theme",
            author: "PEACE",
            description: "Buttery beige hues, flaky layers of a biscuit, blended with warm brown colors.",
        },
        {
            fileName: "cookie-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/cookie-theme.css",
            name: "Mooncord - Cookie Theme",
            author: "PEACE",
            description: "Golden-brown hues, soft chocolate tones, and a touch of creamy sweetness.",
        },
        {
            fileName: "frappe-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/frappe-theme.css",
            name: "Mooncord - Frappé Theme",
            author: "PEACE",
            description: "Creamy beige hues, blended with coffee browns and swirls of frothy white.",
        },
        {
            fileName: "macchiato-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/macchiato-theme.css",
            name: "Mooncord - Macchiato Theme",
            author: "PEACE",
            description: "Rich espresso hues, layered with creamy beige and a touch of caramel tones.",
        },
        {
            fileName: "mocha-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/mocha-theme.css",
            name: "Mooncord - Mocha Theme",
            author: "PEACE",
            description: "Deep black blended with warm purple hues and creamy blue undertones.",
        },
        {
            fileName: "nocturne-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/nocturne-theme.css",
            name: "Mooncord - Nocturne Theme",
            author: "PEACE",
            description: "Black and deep purple tones, illuminated by soft silver highlights.",
        },
        {
            fileName: "nord-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/nord-theme.css",
            name: "Mooncord - Nord Theme",
            author: "PEACE",
            description: "Cool blues and icy grays, evoking the serene beauty of the Arctic landscape.",
        },
        {
            fileName: "pichu-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/pichu-theme.css",
            name: "Mooncord - Pichu Theme",
            author: "PEACE",
            description: "Vibrant rose and deep red hues, capturing the playful spirit of Pichu.",
        },
        {
            fileName: "rose-pine-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/rose-pine-theme.css",
            name: "Mooncord - Rose Pine Theme",
            author: "PEACE",
            description: "Deep purple and rich rose tones, blending warmth with a hint of mystery.",
        },
        {
            fileName: "spotify-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/spotify-theme.css",
            name: "Mooncord - Spotify Theme",
            author: "PEACE",
            description: "Bold greens and dark blacks, the vibe of music, inspired on: (Spotify) - theme.",
        },
        {
            fileName: "visual-theme.css",
            link: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/visual-theme.css",
            name: "Mooncord - Visual Theme",
            author: "PEACE",
            description: "Deep inky blues and shadowy grays, inspired on: (Visual Studio) - theme.",
        },
        // Additional predefined themes can be added here - 2024.10.06 by @PeaceOfficial
    ];

    // Combine online themes with predefined themes
    const combinedThemes = [...(onlineThemes || []), ...predefinedThemes];

    function OnlineThemes() {
        return (
            <>
                <Forms.FormSection title="Online Themes" tag="h5">
                    <Card className="vc-settings-theme-add-card">
                        <Forms.FormText>Make sure to use direct links to files (raw or github.io)!</Forms.FormText>
                        <Flex flexDirection="row">
                            <TextInput placeholder="Theme Link" className="vc-settings-theme-link-input" value={currentThemeLink} onChange={setCurrentThemeLink} />
                            <Button onClick={() => addThemeLink(currentThemeLink)} disabled={!themeLinkValid}>Add</Button>
                        </Flex>
                        {currentThemeLink && <Validator link={currentThemeLink} onValidate={setThemeLinkValid} />}
                    </Card>

                    <div className={cl("grid")}>
                        {combinedThemes.map(rawLink => {
                            const { label, link } = (() => {
                                const match = /^@(light|dark) (.*)/.exec(rawLink.link);
                                if (!match) return { label: rawLink, link: rawLink };

                                const [, mode, link] = match;
                                return { label: `[${mode} mode only] ${link}`, link };
                            })();

                            // Check if the theme is a predefined theme
                            const isPredefinedTheme = predefinedThemes.some(theme => theme.fileName === rawLink.fileName);

                            return (
                                <OtherThemeCard
                                    key={rawLink.fileName}
                                    enabled={settings.enabledThemeLinks.includes(rawLink.link)}
                                    onChange={enabled => onThemeLinkEnabledChange(rawLink.link, enabled)}
                                    onDelete={async () => {
                                        // Prevent deletion if it's a predefined theme
                                        if (!isPredefinedTheme) {
                                            onThemeLinkEnabledChange(rawLink.link, false);
                                            deleteThemeLink(rawLink.link);
                                        }
                                    }}
                                    showDeleteButton={!isPredefinedTheme} // Hide the delete button for predefined themes
                                    theme={rawLink}
                                />
                            );
                        })}
                    </div>

                </Forms.FormSection>
            </>
        );
    }

    return (
        <SettingsTab title="Themes">
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.LOCAL}
                >
                    Local Themes
                </TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.ONLINE}
                >
                    Online Themes
                </TabBar.Item>
            </TabBar>

            {currentTab === ThemeTab.LOCAL && <LocalThemes />}
            {currentTab === ThemeTab.ONLINE && <OnlineThemes />}
        </SettingsTab>
    );
}

export default wrapTab(ThemesTab, "Themes");
