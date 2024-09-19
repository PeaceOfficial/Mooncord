/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "2FaOnServers",
    description: "never get bothered about 2fa moderation again on servers!",
    authors: [Devs.peaceofficial],
    patches: [
        {
            find: "APPLICATION_SUBSCRIPTION_EXPIRATION:",
            replacement: [{
                match: /GUILD_MFA_WARNING:return/,
                replace: "GUILD_MFA_WARNING:return;return"
            }]
        }
    ]
});
