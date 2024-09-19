/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "2FaOnServers",
    description: "never get bothered about 2fa moderation again on servers!",
    authors: [
        {
            id: 317206043039891459n,
            name: "PEACE",
        },
    ],
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