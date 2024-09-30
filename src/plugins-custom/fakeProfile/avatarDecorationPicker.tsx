/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// avatarDecorationPicker.tsx

import { User } from "discord-types/general";
import React, { useState } from "react";

// AvatarDecorationPicker as a named export
export const AvatarDecorationPicker = ({ user }: { user: User; }) => {
    const [selectedDecoration, setSelectedDecoration] = useState<{ asset: string; skuId: string; animated: boolean; } | null>(null);

    const decorationsList = [
        { id: 1, asset: "https://cdn.discordapp.com/avatar-decoration-presets/a_c3c09bd122898be35093d0d59850f627.png", skuId: "SKU123", animated: true },
        { id: 2, asset: "https://cdn.discordapp.com/avatar-decoration-presets/a_13913a00bd9990ab4102a3bf069f0f3f.png", skuId: "SKU124", animated: true },
        { id: 3, asset: "https://cdn.discordapp.com/avatar-decoration-presets/a_9d67a1cbf81fe7197c871e94f619b04b.png", skuId: "SKU125", animated: true },
    ];

    const handleDecorationSelect = (decoration: { asset: string; skuId: string; animated: boolean; }) => {
        setSelectedDecoration(decoration);
    };

    return (
        <div>
            <h2>Choose Your Avatar Decoration</h2>
            <div className="decorations-list">
                {decorationsList.map(decoration => (
                    <div key={decoration.id} onClick={() => handleDecorationSelect(decoration)} className="decoration-item">
                        <img src={decoration.asset} alt={`Decoration ${decoration.id}`} />
                        <p>SKU: {decoration.skuId}</p>
                    </div>
                ))}
            </div>

            <div className="selected-decoration">
                {selectedDecoration ? (
                    <div>
                        <h3>Selected Decoration</h3>
                        <img
                            src={selectedDecoration.asset}
                            alt="Selected Avatar Decoration"
                            style={{ animation: selectedDecoration.animated ? "bounce 1s infinite" : "none" }}
                        />
                        <p>SKU ID: {selectedDecoration.skuId}</p>
                    </div>
                ) : (
                    <p>No decoration selected</p>
                )}
            </div>
        </div>
    );
};

// Other component exported as default
const SomeOtherComponent = () => {
    // Component logic...
    return <div>Another component</div>;
};

export default SomeOtherComponent;
