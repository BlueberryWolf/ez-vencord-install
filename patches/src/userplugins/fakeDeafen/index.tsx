/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import ErrorBoundary from "@components/ErrorBoundary";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { findByCodeLazy,findByPropsLazy } from "@webpack";
import { React, SelectedChannelStore } from "@webpack/common";

interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
}

const Button = findByCodeLazy("Button.Sizes.NONE,disabled:");
const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");
const logger: Logger = new Logger("FakeDeafen", "#7b4af7");

let faking: boolean = false;
let origWS: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;

function log(text: string) {
    logger.info(text);
}

function toggleFakeDeafen() {
    if (faking) {
        faking = false;
        WebSocket.prototype.send = origWS;

        showNotification({
            title: "FakeDeafen",
            body: "Fake deafen is now disabled."
        });
    } else {
        faking = true;

        // Override original websocket prototype
        WebSocket.prototype.send = function (data) {
            const dataType = Object.prototype.toString.call(data);

            switch (dataType) {
                case "[object String]":
                    let obj: any;
                    try {
                        obj = JSON.parse(data);
                    } catch {
                        // Not a json!
                        origWS.apply(this, [data]);
                        return;
                    }

                    if (obj.d !== undefined && obj.d.self_deaf !== undefined && obj.d.self_deaf === false) {
                        // Undeafen packet, discard it
                        return;
                    }
                    break;

                case "[object ArrayBuffer]":
                    const decoder = new TextDecoder("utf-8");
                    if (decoder.decode(data).includes("self_deafs\x05false")) {
                        // Undeafen packet, discard it
                        return;
                    }
                    break;
            }

            // Pass data down to original websocket
            origWS.apply(this, [data]);
        };

        showNotification({
            title: "FakeDeafen",
            body: "Deafening is now faked."
        });
    }
}

export default definePlugin({
    name: "FakeDeafen",
    description: "Fake deafens you. (So you still hear things.)",
    authors: [{ name: "MisleadingName", id: 892072557988151347n }, { name: "Exotic", id: 287667540178501634n }],

    patches: [{
        find: ".Messages.ACCOUNT_SPEAKING_WHILE_MUTED",
        replacement: {
            match: /this\.renderNameZone\(\).+?children:\[/,
            replace: "$&$self.funnyButton(),"
        }
    }],

    funnyButton: ErrorBoundary.wrap(funnyButton, { noop: true }),

    flux: {
        AUDIO_TOGGLE_SELF_DEAF: async function () {
            await new Promise(f => setTimeout(f, 100));

            const chanId = SelectedChannelStore.getVoiceChannelId()!;
            const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
            if (!s) return;

            if (faking && (s.deaf || s.selfDeaf)) {
                const event = new CustomEvent("VOICE_STATE_UPDATE", {
                    detail: {
                        self_deaf: false,
                        self_mute: s.selfMute
                    }
                });
                document.dispatchEvent(event);
            }
        }
    },

    start: function () {
        origWS = WebSocket.prototype.send;
        log("Ready");
    },

    stop: function () {
        WebSocket.prototype.send = origWS;
        log("Disarmed");
    }
});

function makeIcon(enabled?: boolean) {
    const redLinePath = "M22.7 2.7a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4Z";
    const maskBlackPath = "M23.27 4.73 19.27 .73 -.27 20.27 3.73 24.27Z";

    return function () {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                    fill={"currentColor"}
                    mask={!enabled ? "url(#gameActivityMask)" : void 0}
                    d="M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z"
                />
                {!enabled && <>
                    <path fill="var(--status-danger)" d={redLinePath} />
                    <mask id="gameActivityMask">
                        <rect fill="white" x="0" y="0" width="24" height="24" />
                        <path fill="black" d={maskBlackPath} />
                    </mask>
                </>}
            </svg>
        );
    };
}

function funnyButton() {
    return (
        <>
            <Button
                onClick={toggleFakeDeafen}
                role="switch"
                tooltipText={"Toggle Fake Deafening (Sorry GameActivityToggle for stealing your icon :3)"}
                icon={makeIcon(faking)}
            />
        </>
    );
}
