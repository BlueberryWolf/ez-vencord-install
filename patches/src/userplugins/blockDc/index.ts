/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps, findByPropsLazy } from "@webpack";
import { RelationshipStore, SelectedChannelStore, Toasts } from "@webpack/common";

const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");
const logger: Logger = new Logger("BlockDc", "#f74a4a");

let active: boolean = true;

function log(text: any) {
    logger.info(text);
}

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Enable Auto Disconnect",
        default: true,
    },
    notify: {
        type: OptionType.BOOLEAN,
        description: "Show Notifications",
        default: true,
    }
});

export default definePlugin({
    name: "BlockDc",
    description: "Automatically leaves voice channels when blocked users join",
    authors: [{ name: "MisleadingName", id: 892072557988151347n }],
    settings,

    checkBlockedUsers(channelId: string) {
        const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channelId);
        if (!voiceStates) return false;

        let isSomeoneBlocked = false;

        for (const user in voiceStates) {
            const userid: string = voiceStates[user].userId;
            isSomeoneBlocked = RelationshipStore.isBlocked(userid);
        }

        return isSomeoneBlocked;
    },

    handleVoiceUpdate() {
        if (!active) return;

        const currentChannel = SelectedChannelStore.getVoiceChannelId();
        if (!currentChannel) return;

        if (this.checkBlockedUsers(currentChannel)) {
            const voiceModule = findByProps("selectVoiceChannel");
            voiceModule.selectVoiceChannel(null);

            if (settings.store.notify) {
                showNotification({
                    title: "BlockDc",
                    body: "Disconnected because someone you have blocked joined the channel."
                });
            }
        }
    },

    start() {
        this.handleVoiceUpdate = this.handleVoiceUpdate.bind(this);
        VoiceStateStore.addChangeListener(this.handleVoiceUpdate);
    },

    stop() {
        VoiceStateStore.removeChangeListener(this.handleVoiceUpdate);
    },

    toolboxActions: {
        "Toggle Auto Disconnect": () => {
            active = !active;
            Toasts.show({
                message: `Auto disconnect ${active ? "enabled" : "disabled"}.`,
                type: Toasts.Type.SUCCESS,
                id: Toasts.genId()
            });
        }
    }
});
