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

import { debounce } from "@shared/debounce";
import { SettingsStore as SettingsStoreClass } from "@shared/SettingsStore";
import { localStorage } from "@utils/localStorage";
import { Logger } from "@utils/Logger";
import { mergeDefaults } from "@utils/mergeDefaults";
import { putCloudSettings } from "@utils/settingsSync";
import { DefinedSettings, OptionType, SettingsChecks, SettingsDefinition } from "@utils/types";
import { React } from "@webpack/common";

import plugins from "~plugins";

const logger = new Logger("Settings");
export interface Settings {
    autoUpdate: boolean;
    autoUpdateNotification: boolean,
    useQuickCss: boolean;
    enableReactDevtools: boolean;
    themeLinks: string[];
    enabledThemes: string[];
    enabledThemeLinks: string[];
    frameless: boolean;
    transparent: boolean;
    winCtrlQ: boolean;
    macosVibrancyStyle:
    | "content"
    | "fullscreen-ui"
    | "header"
    | "hud"
    | "menu"
    | "popover"
    | "selection"
    | "sidebar"
    | "titlebar"
    | "tooltip"
    | "under-page"
    | "window"
    | undefined;
    disableMinSize: boolean;
    winNativeTitleBar: boolean;
    plugins: {
        [plugin: string]: {
            enabled: boolean;
            [setting: string]: any;
        };
    };

    notifications: {
        timeout: number;
        position: "top-right" | "bottom-right";
        useNative: "always" | "never" | "not-focused";
        logLimit: number;
    };

    cloud: {
        authenticated: boolean;
        url: string;
        settingsSync: boolean;
        settingsSyncVersion: number;
    };

    userCssVars: {
        [themeId: string]: {
            [varName: string]: string;
        };
    };
}

const DefaultSettings: Settings = {
    autoUpdate: false,
    autoUpdateNotification: false,
    useQuickCss: true,
    "themeLinks": [],
    "enabledThemes": [],
    "enabledThemeLinks": [
        "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/themes/default-theme.css"
    ],
    enableReactDevtools: false,
    frameless: false,
    transparent: false,
    winCtrlQ: true,
    macosVibrancyStyle: undefined,
    disableMinSize: false,
    winNativeTitleBar: false,

    "plugins": {
        "ChatInputButtonAPI": {
            "enabled": true
        },
        "CommandsAPI": {
            "enabled": true
        },
        "MemberListDecoratorsAPI": {
            "enabled": true
        },
        "MessageAccessoriesAPI": {
            "enabled": true
        },
        "MessageDecorationsAPI": {
            "enabled": true
        },
        "MessageEventsAPI": {
            "enabled": true
        },
        "MessagePopoverAPI": {
            "enabled": true
        },
        "MessageUpdaterAPI": {
            "enabled": true
        },
        "ServerListAPI": {
            "enabled": true
        },
        "UserSettingsAPI": {
            "enabled": true
        },
        "AccountPanelServerProfile": {
            "enabled": false
        },
        "AlwaysAnimate": {
            "enabled": false
        },
        "AlwaysExpandRoles": {
            "enabled": false
        },
        "AlwaysTrust": {
            "enabled": true,
            "domain": true,
            "file": true
        },
        "AnonymiseFileNames": {
            "enabled": true,
            "anonymiseByDefault": false,
            "fixOpusExtensions": true,
            "method": 0,
            "randomisedLength": 10,
            "consistent": "image"
        },
        "AppleMusicRichPresence": {
            "enabled": false
        },
        "BANger": {
            "enabled": false
        },
        "BetterFolders": {
            "enabled": true,
            "sidebar": true,
            "sidebarAnim": true,
            "closeAllFolders": false,
            "closeAllHomeButton": false,
            "closeOthers": false,
            "forceOpen": false,
            "keepIcons": false,
            "showFolderIcon": 1
        },
        "BetterGifAltText": {
            "enabled": false
        },
        "BetterGifPicker": {
            "enabled": false
        },
        "BetterNotesBox": {
            "enabled": false
        },
        "BetterRoleContext": {
            "enabled": false
        },
        "BetterRoleDot": {
            "enabled": false
        },
        "BetterSessions": {
            "enabled": false,
            "backgroundCheck": false,
            "checkInterval": 20
        },
        "BetterSettings": {
            "enabled": false,
            "disableFade": true,
            "organizeMenu": true,
            "eagerLoad": true
        },
        "BetterUploadButton": {
            "enabled": true
        },
        "BiggerStreamPreview": {
            "enabled": true
        },
        "BlurNSFW": {
            "enabled": false
        },
        "CallTimer": {
            "enabled": true,
            "format": "stopwatch"
        },
        "ClearURLs": {
            "enabled": false
        },
        "ClientTheme": {
            "enabled": false,
            "color": "525048"
        },
        "ColorSighted": {
            "enabled": false
        },
        "ConsoleJanitor": {
            "enabled": true,
            "disableNoisyLoggers": true,
            "disableSpotifyLogger": true,
            "disableLoggers": false,
            "whitelistedLoggers": "GatewaySocket; Routing/Utils"
        },
        "ConsoleShortcuts": {
            "enabled": false
        },
        "CopyEmojiMarkdown": {
            "enabled": false
        },
        "CopyFileContents": {
            "enabled": true
        },
        "CopyUserURLs": {
            "enabled": true
        },
        "CrashHandler": {
            "enabled": true,
            "attemptToPreventCrashes": true,
            "attemptToNavigateToHome": false
        },
        "CtrlEnterSend": {
            "enabled": false,
            "submitRule": "ctrl+enter",
            "sendMessageInTheMiddleOfACodeBlock": true
        },
        "CustomIdle": {
            "enabled": false
        },
        "CustomRPC": {
            "enabled": true,
            "type": 2,
            "timestampMode": 1,
            "appID": "1285734980416307200",
            "appName": "Mooncord 🌕",
            "imageBig": "moonlight",
            "imageBigTooltip": "Mooncord enhances the functionality of Discord, Built upon the foundation of the open-source project called: \"Vencord\".",
            "imageSmall": "moonlight",
            "imageSmallTooltip": "Mooncord, featuring a variety of new enhancements, including: \"Themes, Plugins, Optimizations\".",
            "details": "Mooncord takes a Moonshot at Discord customization, elevating it through solo development by: \"PEACE\", with full transparency.",
            "state": "Version: \"1.4 - RELEASE\" 🌙🌚🌕",
            "buttonOneText": "GITHUB",
            "buttonOneURL": "https://github.com/PeaceOfficial/Mooncord",
            "buttonTwoText": "WEBSITE",
            "buttonTwoURL": "https://github.com/PeaceOfficial/Mooncord",
            "startTime": 0
        },
        "Dearrow": {
            "enabled": false
        },
        "Decor": {
            "enabled": false,
            "baseUrl": "https://decor.fieryflames.dev",
            "agreedToGuidelines": true
        },
        "DevCompanion": {
            "enabled": false
        },
        "DisableCallIdle": {
            "enabled": true
        },
        "DontRoundMyTimestamps": {
            "enabled": false
        },
        "EmoteCloner": {
            "enabled": false
        },
        "Experiments": {
            "enabled": false
        },
        "F8Break": {
            "enabled": false
        },
        "FakeNitro": {
            "enabled": true,
            "enableEmojiBypass": true,
            "emojiSize": 48,
            "transformEmojis": true,
            "enableStickerBypass": true,
            "stickerSize": 160,
            "transformStickers": true,
            "transformCompoundSentence": false,
            "enableStreamQualityBypass": true,
            "useHyperLinks": true,
            "hyperLinkText": "{{NAME}}",
            "disableEmbedPermissionCheck": false
        },
        "FakeProfileThemes": {
            "enabled": false,
            "nitroFirst": true
        },
        "FavoriteEmojiFirst": {
            "enabled": false
        },
        "FavoriteGifSearch": {
            "enabled": false
        },
        "FixCodeblockGap": {
            "enabled": false
        },
        "FixSpotifyEmbeds": {
            "enabled": true,
            "volume": 10
        },
        "FixYoutubeEmbeds": {
            "enabled": true
        },
        "ForceOwnerCrown": {
            "enabled": false
        },
        "FriendInvites": {
            "enabled": false
        },
        "FriendsSince": {
            "enabled": true
        },
        "GameActivityToggle": {
            "enabled": false
        },
        "GifPaste": {
            "enabled": false
        },
        "GreetStickerPicker": {
            "enabled": false
        },
        "HideAttachments": {
            "enabled": false
        },
        "IgnoreActivities": {
            "enabled": false
        },
        "ImageLink": {
            "enabled": false
        },
        "ImageZoom": {
            "enabled": true,
            "saveZoomValues": true,
            "invertScroll": true,
            "nearestNeighbour": false,
            "square": false,
            "zoom": 4.76923076923077,
            "size": 269.2307692307693,
            "zoomSpeed": 0.476923076923077
        },
        "ImplicitRelationships": {
            "enabled": false
        },
        "InvisibleChat": {
            "enabled": false
        },
        "KeepCurrentChannel": {
            "enabled": false
        },
        "LastFMRichPresence": {
            "enabled": false
        },
        "LoadingQuotes": {
            "enabled": false
        },
        "MemberCount": {
            "enabled": true,
            "memberList": true,
            "toolTip": true
        },
        "MentionAvatars": {
            "enabled": true,
            "showAtSymbol": true
        },
        "MessageClickActions": {
            "enabled": true,
            "enableDeleteOnClick": true,
            "enableDoubleClickToEdit": true,
            "enableDoubleClickToReply": true,
            "requireModifier": false
        },
        "MessageLatency": {
            "enabled": false
        },
        "MessageLinkEmbeds": {
            "enabled": false
        },
        "MessageLogger": {
            "enabled": true,
            "deleteStyle": "text",
            "logDeletes": true,
            "collapseDeleted": false,
            "logEdits": true,
            "inlineEdits": true,
            "ignoreBots": false,
            "ignoreSelf": false,
            "ignoreUsers": "",
            "ignoreChannels": "",
            "ignoreGuilds": ""
        },
        "MessageTags": {
            "enabled": false
        },
        "MoreCommands": {
            "enabled": false
        },
        "MoreKaomoji": {
            "enabled": false
        },
        "MoreUserTags": {
            "enabled": false
        },
        "Moyai": {
            "enabled": false
        },
        "MutualGroupDMs": {
            "enabled": false
        },
        "NewGuildSettings": {
            "enabled": false
        },
        "NoBlockedMessages": {
            "enabled": false
        },
        "NoDevtoolsWarning": {
            "enabled": true
        },
        "NoF1": {
            "enabled": true
        },
        "NoMaskedUrlPaste": {
            "enabled": false
        },
        "NoMosaic": {
            "enabled": true,
            "inlineVideo": true
        },
        "NoOnboardingDelay": {
            "enabled": true
        },
        "NoPendingCount": {
            "enabled": false
        },
        "NoProfileThemes": {
            "enabled": false
        },
        "NoReplyMention": {
            "enabled": false
        },
        "NormalizeMessageLinks": {
            "enabled": false
        },
        "NoRPC": {
            "enabled": false
        },
        "NoScreensharePreview": {
            "enabled": false
        },
        "NoServerEmojis": {
            "enabled": false
        },
        "NoSystemBadge": {
            "enabled": false
        },
        "NotificationVolume": {
            "enabled": false
        },
        "NoTypingAnimation": {
            "enabled": false
        },
        "NoUnblockToJump": {
            "enabled": false
        },
        "NSFWGateBypass": {
            "enabled": false
        },
        "Oneko": {
            "enabled": false,
            "speed": 10
        },
        "OpenInApp": {
            "enabled": false
        },
        "OverrideForumDefaults": {
            "enabled": false
        },
        "PartyMode": {
            "enabled": false
        },
        "PauseInvitesForever": {
            "enabled": false
        },
        "PermissionFreeWill": {
            "enabled": false
        },
        "PermissionsViewer": {
            "enabled": false
        },
        "petpet": {
            "enabled": false
        },
        "PictureInPicture": {
            "enabled": false
        },
        "PinDMs": {
            "enabled": true,
            "pinOrder": 1,
            "dmSectioncollapsed": false
        },
        "PlainFolderIcon": {
            "enabled": true
        },
        "PlatformIndicators": {
            "enabled": false
        },
        "PreviewMessage": {
            "enabled": true
        },
        "QuickMention": {
            "enabled": false
        },
        "QuickReply": {
            "enabled": false,
            "shouldMention": 2
        },
        "ReactErrorDecoder": {
            "enabled": false
        },
        "ReadAllNotificationsButton": {
            "enabled": true
        },
        "RelationshipNotifier": {
            "enabled": true,
            "notices": true,
            "offlineRemovals": true,
            "friends": true,
            "friendRequestCancels": true,
            "servers": true,
            "groups": true
        },
        "ReplaceGoogleSearch": {
            "enabled": false
        },
        "ReplyTimestamp": {
            "enabled": false
        },
        "RevealAllSpoilers": {
            "enabled": false
        },
        "ReverseImageSearch": {
            "enabled": false
        },
        "ReviewDB": {
            "enabled": false
        },
        "RoleColorEverywhere": {
            "enabled": false
        },
        "SecretRingToneEnabler": {
            "enabled": false
        },
        "Summaries": {
            "enabled": false
        },
        "SendTimestamps": {
            "enabled": false
        },
        "ServerInfo": {
            "enabled": true
        },
        "ServerListIndicators": {
            "enabled": false
        },
        "ShikiCodeblocks": {
            "enabled": false
        },
        "ShowAllMessageButtons": {
            "enabled": false
        },
        "ShowConnections": {
            "enabled": false
        },
        "ShowHiddenChannels": {
            "enabled": false,
            "hideUnreads": true,
            "showMode": 0,
            "defaultAllowedUsersAndRolesDropdownState": true
        },
        "ShowHiddenThings": {
            "enabled": false
        },
        "ShowMeYourName": {
            "enabled": false
        },
        "ShowTimeoutDuration": {
            "enabled": false
        },
        "SilentMessageToggle": {
            "enabled": false
        },
        "SilentTyping": {
            "enabled": true,
            "showIcon": true,
            "contextMenu": true,
            "isEnabled": false,
            "blockAllTypingIndicators": false,
            "blockAllIsTyping": false,
            "blockEverything": false
        },
        "SortFriendRequests": {
            "enabled": false
        },
        "SpotifyControls": {
            "enabled": false,
            "hoverControls": true,
            "useSpotifyUris": true
        },
        "SpotifyCrack": {
            "enabled": true,
            "noSpotifyAutoPause": true,
            "keepSpotifyActivityOnIdle": false
        },
        "SpotifyShareCommands": {
            "enabled": true
        },
        "StartupTimings": {
            "enabled": false
        },
        "StickerPaste": {
            "enabled": false
        },
        "StreamerModeOn": {
            "enabled": false
        },
        "SuperReactionTweaks": {
            "enabled": false
        },
        "ClientToolbox": {
            "enabled": true
        },
        "TextReplace": {
            "enabled": false
        },
        "ThemeAttributes": {
            "enabled": false
        },
        "Translate": {
            "enabled": true,
            "showChatBarButton": true,
            "service": "google",
            "deeplApiKey": "",
            "autoTranslate": false,
            "showAutoTranslateTooltip": true,
            "receivedInput": "auto",
            "receivedOutput": "hu",
            "sentInput": "auto",
            "sentOutput": "en"
        },
        "TypingIndicator": {
            "enabled": true,
            "includeCurrentChannel": true,
            "includeMutedChannels": false,
            "includeBlockedUsers": false,
            "indicatorMode": 3
        },
        "TypingTweaks": {
            "enabled": true,
            "showAvatars": true,
            "showRoleColors": true,
            "alternativeFormatting": true
        },
        "Unindent": {
            "enabled": false
        },
        "UnlockedAvatarZoom": {
            "enabled": true,
            "zoomMultiplier": 4
        },
        "UnsuppressEmbeds": {
            "enabled": false
        },
        "UserVoiceShow": {
            "enabled": true,
            "showInUserProfileModal": true,
            "showInVoiceMemberList": true,
            "showInMemberList": true,
            "showInMessages": true
        },
        "ValidReply": {
            "enabled": false
        },
        "ValidUser": {
            "enabled": false
        },
        "VoiceChatDoubleClick": {
            "enabled": false
        },
        "VcNarrator": {
            "enabled": false
        },
        "ViewIcons": {
            "enabled": true,
            "format": "webp",
            "imgSize": "1024"
        },
        "ViewRaw": {
            "enabled": false,
            "clickMethod": "Left"
        },
        "VoiceDownload": {
            "enabled": true
        },
        "VoiceMessages": {
            "enabled": true,
            "noiseSuppression": true,
            "echoCancellation": false
        },
        "VolumeBooster": {
            "enabled": true,
            "multiplier": 2
        },
        "WhoReacted": {
            "enabled": true,
            "avatarClick": false
        },
        "XSOverlay": {
            "enabled": false
        },
        "YoutubeAdblock": {
            "enabled": true
        },
        "AllCallTimers": {
            "enabled": true,
            "showWithoutHover": true,
            "showRoleColor": true,
            "trackSelf": true,
            "showSeconds": true,
            "format": "stopwatch",
            "watchLargeGuilds": false
        },
        "AltKrispSwitch": {
            "enabled": false
        },
        "AmITyping": {
            "enabled": false
        },
        "Anammox": {
            "enabled": false,
            "dms": true,
            "billing": true,
            "gift": true,
            "emojiList": true
        },
        "atSomeone": {
            "enabled": false
        },
        "DecodeBase64": {
            "enabled": false
        },
        "BetterActivities": {
            "enabled": false,
            "memberList": true,
            "iconSize": 15,
            "specialFirst": true,
            "renderGifs": true,
            "showAppDescriptions": true,
            "userPopout": true,
            "allActivitiesStyle": "carousel"
        },
        "BetterBanReasons": {
            "enabled": false
        },
        "BetterQuickReact": {
            "enabled": false,
            "frequentEmojis": true,
            "rows": 2,
            "columns": 4,
            "compactMode": false,
            "scroll": true
        },
        "BetterUserArea": {
            "enabled": false
        },
        "BlockKeywords": {
            "enabled": false
        },
        "BlockKrisp": {
            "enabled": false
        },
        "BypassStatus": {
            "enabled": false,
            "guilds": "",
            "channels": "",
            "users": "",
            "notificationSound": true,
            "statusToUse": "dnd"
        },
        "ChannelTabs": {
            "enabled": true,
            "showBookmarkBar": true,
            "widerTabsAndBookmarks": true,
            "onStartup": "nothing",
            "noPomeloNames": false,
            "showStatusIndicators": true,
            "bookmarkNotificationDot": true,
            "tabSet": {}
        },
        "CleanChannelName": {
            "enabled": false
        },
        "ClientSideBlock": {
            "enabled": false,
            "usersToBlock": "",
            "hideBlockedUsers": true,
            "hideBlockedMessages": true,
            "hideEmptyRoles": true,
            "blockedReplyDisplay": "displayText",
            "guildBlackList": "",
            "guildWhiteList": ""
        },
        "ColorMessage": {
            "enabled": true,
            "saturation": 30
        },
        "CommandPalette": {
            "enabled": false,
            "hotkey": [
                "Control",
                "Shift",
                "P"
            ],
            "allowMouseControl": true
        },
        "CopyUserMention": {
            "enabled": false
        },
        "CustomSounds": {
            "enabled": false
        },
        "CuteAnimeBoys": {
            "enabled": false
        },
        "CuteNekos": {
            "enabled": false
        },
        "CutePats": {
            "enabled": false
        },
        "Demonstration": {
            "enabled": false,
            "keyBind": "F6",
            "soundVolume": 0.5,
            "showConfirmationModal": true
        },
        "DisableCameras": {
            "enabled": false
        },
        "DoNotLeak": {
            "enabled": false
        },
        "DontFilterMe": {
            "enabled": false
        },
        "DoubleCounterBypass": {
            "enabled": false
        },
        "EmojiDumper": {
            "enabled": false
        },
        "Encryptcord": {
            "enabled": false
        },
        "MooncordCSS": {
            "enabled": false,
            "betterAuthApps": false,
            "betterStatusPicker": false,
            "gradientButtons": false,
            "nitroThemesFix": false,
            "settingsIcons": false,
            "userReimagined": false
        },
        "ExportContacts": {
            "enabled": false
        },
        "FindReply": {
            "enabled": false
        },
        "FrequentQuickSwitcher": {
            "enabled": false
        },
        "FriendshipRanks": {
            "enabled": false
        },
        "FriendTags": {
            "enabled": false
        },
        "GifRoulette": {
            "enabled": false
        },
        "Glide": {
            "enabled": false,
            "serverListAnim": false,
            "memberListAnim": true,
            "privacyBlur": false,
            "tooltips": false,
            "customFont": "@import url('https://fonts.googleapis.com/css2?family=Poppins&wght@500&display=swap');",
            "animationSpeed": "0.2",
            "ColorPreset": 0,
            "Primary": "582e52",
            "Accent": "53294d",
            "Text": "ddd0d0",
            "Brand": "582e52",
            "pastelStatuses": true
        },
        "GlobalBadges": {
            "enabled": true,
            "showPrefix": true,
            "showCustom": true
        },
        "GodMode": {
            "enabled": false
        },
        "GoodPerson": {
            "enabled": false
        },
        "GoogleThat": {
            "enabled": false
        },
        "Grammar": {
            "enabled": false
        },
        "GrammarFix": {
            "enabled": false
        },
        "HideMessage": {
            "enabled": false
        },
        "HideServers": {
            "enabled": false
        },
        "HolyNotes": {
            "enabled": false
        },
        "HomeTyping": {
            "enabled": false
        },
        "HopOn": {
            "enabled": false,
            "regex": "hop on (?:fortnite|fn)",
            "url": "com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch&silent=true"
        },
        "Husk": {
            "enabled": false
        },
        "Identity": {
            "enabled": false
        },
        "IgnoreTerms": {
            "enabled": false
        },
        "InRole": {
            "enabled": false
        },
        "IrcColors": {
            "enabled": false
        },
        "IRememberYou": {
            "enabled": false
        },
        "Jumpscare": {
            "enabled": false
        },
        "JumpToStart": {
            "enabled": false
        },
        "KeyboardSounds": {
            "enabled": true,
            "volume": 100
        },
        "KeywordNotify": {
            "enabled": false
        },
        "LimitMiddleClickPaste": {
            "enabled": false
        },
        "LoginWithQR": {
            "enabled": false
        },
        "MediaDownloader": {
            "enabled": false,
            "showProgress": true,
            "showFfmpegWarning": true,
            "defaultGifQuality": 3
        },
        "MediaPlaybackSpeed": {
            "enabled": false
        },
        "Meow": {
            "enabled": false
        },
        "MessageColors": {
            "enabled": false
        },
        "MessageLinkTooltip": {
            "enabled": false
        },
        "MessageLoggerEnhanced": {
            "enabled": true,
            "saveMessages": true,
            "saveImages": true,
            "sortNewest": true,
            "cacheMessagesFromServers": false,
            "ignoreBots": false,
            "ignoreSelf": false,
            "ignoreMutedGuilds": false,
            "ignoreMutedCategories": false,
            "ignoreMutedChannels": false,
            "alwaysLogDirectMessages": true,
            "alwaysLogCurrentChannel": true,
            "permanentlyRemoveLogByDefault": false,
            "hideMessageFromMessageLoggers": false,
            "ShowLogsButton": true,
            "hideMessageFromMessageLoggersDeletedMessage": "redacted eh",
            "messageLimit": 200,
            "imagesLimit": 100,
            "cacheLimit": 1000,
            "whitelistedIds": "",
            "blacklistedIds": "",
            "imageCacheDir": "C:\\Users\\PEACE\\AppData\\Roaming\\Mooncord\\MessageLoggerData\\savedImages",
            "logsDir": "C:\\Users\\PEACE\\AppData\\Roaming\\Mooncord\\MessageLoggerData"
        },
        "MessageTranslate": {
            "enabled": false,
            "targetLanguage": "en",
            "confidenceRequirement": "0.8"
        },
        "ModalFade": {
            "enabled": false
        },
        "NewPluginsManager": {
            "enabled": true
        },
        "NoAppsAllowed": {
            "enabled": false
        },
        "NoBulletPoints": {
            "enabled": false
        },
        "NoDeleteSafety": {
            "enabled": false
        },
        "NoMirroredCamera": {
            "enabled": false
        },
        "NoModalAnimation": {
            "enabled": false
        },
        "NoNitroUpsell": {
            "enabled": true
        },
        "NoRoleHeaders": {
            "enabled": false
        },
        "NotificationTitle": {
            "enabled": false
        },
        "OnePingPerDM": {
            "enabled": false
        },
        "PlatformSpoofer": {
            "enabled": false,
            "platform": "mobile"
        },
        "PurgeMessages": {
            "enabled": false
        },
        "QuestCompleter": {
            "enabled": true
        },
        "QuestionMarkReplacement": {
            "enabled": false
        },
        "Quoter": {
            "enabled": false
        },
        "RepeatMessage": {
            "enabled": false
        },
        "ReplaceActivityTypes": {
            "enabled": false
        },
        "ReplyPingControl": {
            "enabled": false
        },
        "SearchFix": {
            "enabled": false
        },
        "SekaiStickers": {
            "enabled": false
        },
        "ShowBadgesInChat": {
            "enabled": true,
            "showEquicordDonor": false,
            "showEquicordContributor": false,
            "showVencordDonor": false,
            "showVencordContributor": false,
            "showDiscordProfile": true,
            "showDiscordNitro": true,
            "EquicordDonorPosition": 3,
            "VencordDonorPosition": 4,
            "DiscordNitroPosition": 3,
            "EquicordContributorPosition": 2,
            "DiscordProfilePosition": 1,
            "VencordContributorPosition": 5,
            "showMooncordDonor": true,
            "MooncordDonorPosition": 0,
            "showMooncordContributor": true,
            "MooncordContributorPosition": 2
        },
        "Slap": {
            "enabled": false
        },
        "SoundBoardLogger": {
            "enabled": false,
            "FileType": ".ogg",
            "soundVolume": 0.5,
            "IconLocation": "toolbar"
        },
        "StatusWhilePlaying": {
            "enabled": false,
            "statusToSet": "dnd"
        },
        "SteamStatusSync": {
            "enabled": false,
            "onlineStatus": "online",
            "idleStatus": "away",
            "dndStatus": "none",
            "invisibleStatus": "invisible"
        },
        "StickerBlocker": {
            "enabled": false
        },
        "TalkInReverse": {
            "enabled": false
        },
        "TeX": {
            "enabled": false
        },
        "TextToSpeech": {
            "enabled": false
        },
        "ThemeLibrary": {
            "enabled": false,
            "hideWarningCard": false
        },
        "Timezones": {
            "enabled": false,
            "24h Time": false,
            "showMessageHeaderTime": true,
            "showProfileTime": true
        },
        "Title": {
            "enabled": false,
            "title": "Mooncord"
        },
        "Translate+": {
            "enabled": false,
            "target": "en",
            "toki": true,
            "sitelen": true,
            "shavian": true
        },
        "UnitConverter": {
            "enabled": false
        },
        "UnlimitedAccounts": {
            "enabled": false
        },
        "UnreadCountBadge": {
            "enabled": false
        },
        "UwUifier": {
            "enabled": false
        },
        "VCSupport": {
            "enabled": false
        },
        "VideoSpeed": {
            "enabled": false
        },
        "ViewRaw2": {
            "enabled": true
        },
        "VoiceChatUtilities": {
            "enabled": false
        },
        "WebpackTarball": {
            "enabled": false,
            "patched": true
        },
        "WhosWatching": {
            "enabled": true,
            "showPanel": true
        },
        "WigglyText": {
            "enabled": false
        },
        "Woof": {
            "enabled": false
        },
        "YoutubeDescription": {
            "enabled": false
        },
        "NoTrack": {
            "enabled": true,
            "disableAnalytics": true
        },
        "Settings": {
            "enabled": true,
            "settingsLocation": "aboveNitro"
        },
        "SupportHelper": {
            "enabled": true
        },
        "ContextMenuAPI": {
            "enabled": true
        },
        "2FaOnServers": {
            "enabled": true
        },
        "NoMouseNavigation": {
            "enabled": true
        },
        "noMouseNavigation": {
            "enabled": true
        },
        "FullSearchContext": {
            "enabled": true
        },
        "SearchReply": {
            "enabled": false
        },
        "AtSomeone": {
            "enabled": false
        },
        "BannersEverywhere": {
            "enabled": false,
            "animate": true
        },
        "FullUserInChatbox": {
            "enabled": false
        },
        "CustomFolderIcons": {
            "enabled": false,
            "folderIcons": {},
            "solidIcon": false
        },
        "DeadMembers": {
            "enabled": false
        },
        "ServerSearch": {
            "enabled": false
        },
        "BigFileUpload": {
            "enabled": true,
            "fileUploader": "Litterbox",
            "customUploaderName": "",
            "customUploaderRequestURL": "",
            "customUploaderFileFormName": "",
            "customUploaderResponseType": "Text",
            "customUploaderURL": "",
            "customUploaderThumbnailURL": "",
            "customUploaderHeaders": "{}",
            "customUploaderArgs": "{}",
            "catboxUserHash": "",
            "litterboxTime": "72h"
        },
        "Moonlink": {
            "enabled": true,
            "enableProfileEffects": true,
            "enableProfileThemes": true,
            "enableCustomBadges": true,
            "enableAvatarDecorations": true,
            "showCustomBadgesinmessage": true,
            "nitroFirst": true,
            "voiceBackground": true
        },
        "IloveSpam": {
            "enabled": false
        },
        "UserMessagesPronouns": {
            "enabled": false
        },
        "WhitelistedEmojis": {
            "enabled": false
        },
        "EquicordToolbox": {
            "enabled": false
        },
        "FixImagesQuality": {
            "enabled": false
        },
        "ILoveSpam": {
            "enabled": false
        },
        "USRBG": {
            "enabled": false
        },
        "BetterAudioPlayer": {
            "enabled": false
        },
        "BetterInvites": {
            "enabled": false
        },
        "ChannelBadges": {
            "enabled": false
        },
        "CharacterCounter": {
            "enabled": true,
            "colorEffects": true,
            "position": false
        },
        "CustomTimestamps": {
            "enabled": false
        },
        "EquicordCSS": {
            "enabled": false
        },
        "FakeProfileThemesAndEffects": {
            "enabled": false
        },
        "FixFileExtensions": {
            "enabled": false
        },
        "GensokyoRadioRPC": {
            "enabled": false
        },
        "GifCollections": {
            "enabled": false
        },
        "HideChatButtons": {
            "enabled": false
        },
        "ImagePreview": {
            "enabled": false
        },
        "MessagePeek": {
            "enabled": false
        },
        "MoreStickers": {
            "enabled": false
        },
        "MoreThemes": {
            "enabled": false
        },
        "PinIcon": {
            "enabled": false
        },
        "RemixMe": {
            "enabled": false
        },
        "RPCStats": {
            "enabled": false
        },
        "SidebarChat": {
            "enabled": false
        },
        "StatusPresets": {
            "enabled": false
        },
        "TosuRPC": {
            "enabled": false
        },
        "UserPFP": {
            "enabled": false
        },
        "VencordRPC": {
            "enabled": false
        },
        "VoiceChannelLog": {
            "enabled": false
        },
        "WriteUpperCase": {
            "enabled": false
        },
        "iLoveSpam": {
            "enabled": false
        },
        "PronounDB": {
            "enabled": false
        },
        "NoDefaultEmojis": {
            "enabled": false
        }
    },

    "notifications": {
        "timeout": 2000,
        "position": "bottom-right",
        "useNative": "not-focused",
        "logLimit": 50
    },

    cloud: {
        authenticated: false,
        url: "https://cloud.mooncord.fyi/",
        settingsSync: false,
        settingsSyncVersion: 0
    },

    userCssVars: {}
};

const settings = !IS_REPORTER ? VencordNative.settings.get() : {} as Settings;
mergeDefaults(settings, DefaultSettings);

const saveSettingsOnFrequentAction = debounce(async () => {
    if (Settings.cloud.settingsSync && Settings.cloud.authenticated) {
        await putCloudSettings();
        delete localStorage.Vencord_settingsDirty;
    }
}, 60_000);


export const SettingsStore = new SettingsStoreClass(settings, {
    readOnly: true,
    getDefaultValue({
        target,
        key,
        path
    }) {
        const v = target[key];
        if (!plugins) return v; // plugins not initialised yet. this means this path was reached by being called on the top level

        if (path === "plugins" && key in plugins)
            return target[key] = {
                enabled: IS_REPORTER || plugins[key].required || plugins[key].enabledByDefault || false
            };

        // Since the property is not set, check if this is a plugin's setting and if so, try to resolve
        // the default value.
        if (path.startsWith("plugins.")) {
            const plugin = path.slice("plugins.".length);
            if (plugin in plugins) {
                const setting = plugins[plugin].options?.[key];
                if (!setting) return v;

                if ("default" in setting)
                    // normal setting with a default value
                    return (target[key] = setting.default);

                if (setting.type === OptionType.SELECT) {
                    const def = setting.options.find(o => o.default);
                    if (def)
                        target[key] = def.value;
                    return def?.value;
                }
            }
        }
        return v;
    }
});

if (!IS_REPORTER) {
    SettingsStore.addGlobalChangeListener((_, path) => {
        SettingsStore.plain.cloud.settingsSyncVersion = Date.now();
        localStorage.Vencord_settingsDirty = true;
        saveSettingsOnFrequentAction();
        VencordNative.settings.set(SettingsStore.plain, path);
    });
}

/**
 * Same as {@link Settings} but unproxied. You should treat this as readonly,
 * as modifying properties on this will not save to disk or call settings
 * listeners.
 * WARNING: default values specified in plugin.options will not be ensured here. In other words,
 * settings for which you specified a default value may be uninitialised. If you need proper
 * handling for default values, use {@link Settings}
 */
export const PlainSettings = settings;
/**
 * A smart settings object. Altering props automagically saves
 * the updated settings to disk.
 * This recursively proxies objects. If you need the object non proxied, use {@link PlainSettings}
 */
export const Settings = SettingsStore.store;

/**
 * Settings hook for React components. Returns a smart settings
 * object that automagically triggers a rerender if any properties
 * are altered
 * @param paths An optional list of paths to whitelist for rerenders
 * @returns Settings
 */
// TODO: Representing paths as essentially "string[].join('.')" wont allow dots in paths, change to "paths?: string[][]" later
export function useSettings(paths?: UseSettings<Settings>[]) {
    const [, forceUpdate] = React.useReducer(() => ({}), {});

    React.useEffect(() => {
        if (paths) {
            paths.forEach(p => SettingsStore.addChangeListener(p, forceUpdate));
            return () => paths.forEach(p => SettingsStore.removeChangeListener(p, forceUpdate));
        } else {
            SettingsStore.addGlobalChangeListener(forceUpdate);
            return () => SettingsStore.removeGlobalChangeListener(forceUpdate);
        }
    }, []);

    return SettingsStore.store;
}

export function migratePluginSettings(name: string, ...oldNames: string[]) {
    const { plugins } = SettingsStore.plain;
    if (name in plugins) return;

    for (const oldName of oldNames) {
        if (oldName in plugins) {
            logger.info(`Migrating settings from old name ${oldName} to ${name}`);
            plugins[name] = plugins[oldName];
            delete plugins[oldName];
            SettingsStore.markAsChanged();
            break;
        }
    }
}

export function definePluginSettings<
    Def extends SettingsDefinition,
    Checks extends SettingsChecks<Def>,
    PrivateSettings extends object = {}
>(def: Def, checks?: Checks) {
    const definedSettings: DefinedSettings<Def, Checks, PrivateSettings> = {
        get store() {
            if (!definedSettings.pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return Settings.plugins[definedSettings.pluginName] as any;
        },
        get plain() {
            if (!definedSettings.pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return PlainSettings.plugins[definedSettings.pluginName] as any;
        },
        use: settings => useSettings(
            settings?.map(name => `plugins.${definedSettings.pluginName}.${name}`) as UseSettings<Settings>[]
        ).plugins[definedSettings.pluginName] as any,
        def,
        checks: checks ?? {} as any,
        pluginName: "",

        withPrivateSettings<T extends object>() {
            return this as DefinedSettings<Def, Checks, T>;
        }
    };

    return definedSettings;
}

type UseSettings<T extends object> = ResolveUseSettings<T>[keyof T];

type ResolveUseSettings<T extends object> = {
    [Key in keyof T]:
    Key extends string
    ? T[Key] extends Record<string, unknown>
    // @ts-ignore "Type instantiation is excessively deep and possibly infinite"
    ? UseSettings<T[Key]> extends string ? `${Key}.${UseSettings<T[Key]>}` : never
    : Key
    : never;
};
