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

export const WEBPACK_CHUNK = "webpackChunkdiscord_app";
export const REACT_GLOBAL = "Vencord.Webpack.Common.React";
export const SUPPORT_CHANNEL_ID = "1173342942858055721";
export const SUPPORT_CHANNEL_IDS = ["1173342942858055721", "1026515880080842772"];
export const VC_SUPPORT_CHANNEL_ID = "1026515880080842772";

export interface Dev {
    name: string;
    id: bigint;
    badge?: boolean;
}

/**
 * If you made a plugin or substantial contribution, add yourself here.
 * This object is used for the plugin author list, as well as to add a contributor badge to your profile.
 * If you wish to stay fully anonymous, feel free to set ID to 0n.
 * If you are fine with attribution but don't want the badge, add badge: false
 */
export const Devs = /* #__PURE__*/ Object.freeze({
    Ven: {
        name: "peaceofficial",
        id: 317206043039891459n
    },
} satisfies Record<string, Dev>);

// iife so #__PURE__ works correctly
export const VencordDevsById = /* #__PURE__*/ (() =>
    Object.freeze(Object.fromEntries(
        Object.entries(Devs)
            .filter(d => d[1].id !== 0n)
            .map(([_, v]) => [v.id, v] as const)
    ))
)() as Record<string, Dev>;

export const EquicordDevsById = /* #__PURE__*/ (() =>
    Object.freeze(Object.fromEntries(
        Object.entries(EquicordDevs)
            .filter(d => d[1].id !== 0n)
            .map(([_, v]) => [v.id, v] as const)
    ))
)() as Record<string, Dev>;
