import { definePluginSettings } from "@api/Settings";
import { Link } from "@components/Link";
import { MooncordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { User } from "discord-types/general";

let data = {
    avatars: {} as Record<string, string>,
};

const settings = definePluginSettings({
    preferNitro: {
        description: "Which avatar to use if both default animated (Nitro) pfp and MoonlighAvatar avatars are present",
        type: OptionType.SELECT,
        options: [
            { label: "MoonlighAvatar", value: false },
            { label: "Nitro", value: true, default: true },
        ],
    },
    urlForDB: {
        type: OptionType.SELECT,
        description: "Which Database url to use to load avatars, KNOW WHAT YOUR DOING",
        options: [
            {
                label: "MoonlighAvatar Default DB",
                value: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/profiles/avatars.json",
                default: true
            },
            {
                label: "MoonlighAvatar Backup DB",
                value: "https://raw.githubusercontent.com/PeaceOfficial/Mooncord/refs/heads/main/src/modules/profiles/avatars.json"
            }
        ]
    }
});

export default definePlugin({
    data,
    name: "MoonlighAvatar",
    description: "Allows you to use an animated avatar without Nitro",
    authors: [MooncordDevs.peaceofficial],
    settings,
    settingsAboutComponent: () => (
        <>
            <Link href="https://soon-you-can-request.com">
                <b>Submit your own PFP here!</b>
            </Link>
            <br></br>
            <Link href="https://soon-you-can-request.com">
                <b>Support MoonlighAvatar here!</b>
            </Link>
        </>
    ),
    patches: [
        {
            find: "getUserAvatarURL:",
            replacement: [
                {
                    match: /(getUserAvatarURL:)(\i),/,
                    replace: "$1$self.getAvatarHook($2),"
                }
            ]
        }
    ],
    getAvatarHook: (original: any) => (user: User, animated: boolean, size: number) => {
        if (settings.store.preferNitro && user.avatar?.startsWith("a_")) return original(user, animated, size);

        return data.avatars[user.id] ?? original(user, animated, size);
    },
    async start() {
        const res = await fetch(settings.store.urlForDB)
            .then(async res => {
                if (res.ok) this.data = data = await res.json();
            })
            .catch(() => null);
    }
});
