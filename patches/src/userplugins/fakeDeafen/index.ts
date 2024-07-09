/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { SelectedChannelStore } from "@webpack/common";

interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
}

const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");

let faking: boolean = false;

function log(text: string) {
    new Logger("FakeDeafen", "#7b4af7").info(text);
}

export default definePlugin({
    name: "FakeDeafen",
    description: "Fake deafens you. (So you still hear things.)",
    authors: [{ name: "MisleadingName", id: 892072557988151347n }],

    flux: {
        AUDIO_TOGGLE_SELF_DEAF: async function () {
            await new Promise(f => setTimeout(f, 100));

            const chanId = SelectedChannelStore.getVoiceChannelId()!;
            const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
            if (!s) return;

            const event = s.deaf || s.selfDeaf ? "undeafen" : "deafen";
            const text = new TextDecoder("utf-8");
            if (event === "deafen") {
                WebSocket.prototype.send = function (data) {
                    if (Object.prototype.toString.call(data) === "[object ArrayBuffer]") {
                        if (text.decode(data).includes("self_deafs\x05false")) {
                            log("Discarding undeafen packet");
                            WebSocket.prototype.send = WebSocket.prototype.original;
                            faking = true;

                            showNotification({
                                title: "FakeDeafen",
                                body: "Re-deafen to disable."
                            });

                            return;
                        }
                    }
                    WebSocket.prototype.original.apply(this, [data]);
                };

                showNotification({
                    title: "FakeDeafen",
                    body: "Deafening is now faked. Please undeafen."
                });

                log("Injected");
            } else if(event === "undeafen" && faking) {
                // showNotification({
                //     title: "FakeDeafen",
                //     body: "No longer faking."
                // });

                faking = false;
                return;
            }
        }
    },

    start: function () {
        // const text: TextDecoder = new TextDecoder("utf-8");
        //
        WebSocket.prototype.original = WebSocket.prototype.send;
        // WebSocket.prototype.send = function (data) {
        //     if (Object.prototype.toString.call(data) === "[object ArrayBuffer]") {
        //         if (text.decode(data).includes("self_deaf")) {
        //             data = data.replace('"self_mute":false');
        //         }
        //     }
        //     WebSocket.prototype.original.apply(this, [data]);
        // };
        //
        // showNotification({
        //     title: "FakeDeafen",
        //     body: "Deafening is now armed. Please undeafen."
        // });
        //
        log("Ready");
    },

    stop: function () {
        WebSocket.prototype.send = WebSocket.prototype.original;

        log("Disarmed");
    }
});
