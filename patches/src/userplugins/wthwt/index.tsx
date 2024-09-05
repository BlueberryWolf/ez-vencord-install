/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { showNotification } from "@api/Notifications";
import { Settings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, PluginOptionsItem } from "@utils/types";
import { Button, ChannelStore, Forms, GuildMemberStore, GuildStore, SelectedChannelStore, SelectedGuildStore, UserStore } from "@webpack/common";

import Test from "./components";

enum ActivityType {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    MOVED = "moved"
}

enum NotificationRarity {
    EveryTime = "all",
    OncePerServer = "server",
    OncePerSession = "session",
    Never = "none"
}

interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
}

export interface HistoryData {
    userId: string;
    channelId?: string;
    newChannelId?: string;
    guildId?: string;
    timestamp: number;
    type: ActivityType;
}

export interface HistoryRetrievedData {
    username: string;
    displayName: string;
    channelName?: string;
    oldChannelName?: string;
    guildName: string;
    avatarUrl?: string;
    typeString: string;
}

const pluginName: string = "WhoTheHellWasThat";
const pluginLogger: Logger = new Logger(pluginName);

let isActive: boolean = false;
const notificationShown: boolean = false;

const visitedServers: Set<string> = new Set();
const visitedChannels: Set<string> = new Set();

const getDataKey = () => `WTHWS_data_${UserStore.getCurrentUser().id}`;
let history: HistoryData[] = [];

const padNumber = (n: number) => n.toString().padStart(2, "0");

export function retrieveHistoryData({ userId, channelId, oldChannelId }: VoiceState): HistoryRetrievedData {
    const myGuildId = SelectedGuildStore.getGuildId();
    const myId = UserStore.getCurrentUser().id;
    const isMe = userId === myId;

    const user = UserStore.getUser(isMe ? myId : userId).username;
    const displayName = user && ((UserStore.getUser(userId) as any).globalName ?? user);
    const nickname = user && (GuildMemberStore.getNick(myGuildId, userId) ?? user);
    const newChannel = channelId ? ChannelStore.getChannel(channelId).name : undefined;
    const oldChannel = oldChannelId ? ChannelStore.getChannel(oldChannelId).name : undefined;
    const guildName = GuildStore.getGuild(ChannelStore.getChannel(channelId! ?? oldChannelId!).guild_id).name;
    const avatarUrl = UserStore.getUser(isMe ? myId : userId).getAvatarURL();
    const typeString = !channelId ? "left" : oldChannelId ? "moved to" : "joined";

    return {
        username: displayName,
        displayName: nickname,
        channelName: newChannel,
        oldChannelName: oldChannel,
        guildName: guildName,
        avatarUrl: avatarUrl,
        typeString: typeString
    };
}

export function formatTimestamp(time: number) {
    const timestamp = new Date(time);
    let tmpString = "";

    tmpString += `${padNumber(timestamp.getHours())}:${padNumber(timestamp.getMinutes())}`;
    tmpString += " ";
    tmpString += `(${timestamp.getDate()}/${timestamp.getMonth()})`;

    return tmpString;
}

async function writeLog() {
    await DataStore.set(getDataKey(), history);
}

async function createHistoryData(state: VoiceState) {
    const { userId, channelId, oldChannelId } = state;
    const { sizeLimit } = Settings.plugins[pluginName];

    let index: number = 0;
    if (sizeLimit !== -1 && history.length >= sizeLimit) {
        while (history.length >= sizeLimit) {
            history.splice(0, 1);
            index++;
        }

        pluginLogger.info(`History was above the size limit. Removed ${index} items`);
    }

    history.push({
        userId: userId,
        channelId: oldChannelId ?? channelId,
        newChannelId: channelId,
        guildId: SelectedGuildStore.getGuildId(),
        timestamp: Date.now(),
        type: !channelId ? ActivityType.DISCONNECTED : oldChannelId ? ActivityType.MOVED : ActivityType.CONNECTED
    });

    pluginLogger.info(history);

    await writeLog();
}

async function loadHistoryData() {
    history = await DataStore.get<HistoryData[]>(getDataKey()) ?? [];

    pluginLogger.info(history.length ? "Loaded stored data" : "Creating new data store");
}

async function clearHistoryData() {
    history = [];
    await writeLog();

    pluginLogger.info("Cleared voice history");
}

export default definePlugin({
    name: pluginName,
    description: "Keep a log of who joined/left a voice chat",
    authors: [
        { name: "sick_stick_10", id: 117725506748678144n },
        { name: "miss_syv", id: 267317808474488833n }
    ],

    start() {
        loadHistoryData();
    },

    stop() {
        const { persistentData } = Settings.plugins[pluginName];
        if (!persistentData) {
            clearHistoryData();
        }
    },

    flux: {
        // TODO: Fix streams being detected as a connection
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const myGuildId = SelectedGuildStore.getGuildId();
            const myChannelId = SelectedChannelStore.getVoiceChannelId();
            const myId = UserStore.getCurrentUser().id;

            if (ChannelStore.getChannel(myChannelId!)?.type === 13) return;

            for (const state of voiceStates) {
                const { userId, channelId, oldChannelId } = state;
                const isMe = userId === myId;
                const time = Date.now();

                if (isMe) {
                    isActive = channelId !== undefined;

                    // Might possibly cause issues (maybe?)
                    if (!isActive) return;

                    if (Settings.plugins[pluginName].notification !== NotificationRarity.Never) {
                        // if (!((notificationShown && Settings.plugins[pluginName].notificationRarity === NotificationRarity.OncePerSession) ||
                        //     (channelId && visitedChannels.has(channelId) && Settings.plugins[pluginName].notificationRarity !== NotificationRarity.EveryTime) ||
                        //     (visitedServers.has(myGuildId) && Settings.plugins[pluginName].notificationRarity === NotificationRarity.OncePerServer))
                        // ) {
                        //     showNotification({
                        //         title: "Who The Hell Was That?",
                        //         body: myChannelId ? "WTHWS logging is enabled! Click here to configure the plugin" : "WTHWS logging stopped",
                        //         //      ^ Successfully detecting a disconnect!
                        //         onClick: () => { }
                        //     });

                        //     notificationShown = true;
                        //     visitedServers.add(myGuildId);
                        //     if (channelId) visitedChannels.add(channelId);
                        // }
                    }
                }

                // Check that the event is from the voice channel the user is currently in.
                if (!myChannelId) continue;
                if (channelId !== myChannelId && oldChannelId !== myChannelId) continue;
                if (!(channelId !== oldChannelId)) continue;

                const { username, displayName, channelName, oldChannelName, guildName } = retrieveHistoryData(state);
                const message = `${isMe ? "You" : `${username} (${displayName})`} ${!channelId ? "left" : oldChannelId ? "moved to" : "joined"} '${channelId ? channelName : oldChannelId ? oldChannelName : "N/A"}' ${oldChannelId && channelId && !isMe ? `from ${oldChannelName} in server '${guildName}'` : `in server ${guildName}`} at ${formatTimestamp(time)}`;

                showNotification({
                    title: "Who The Hell Was That?",
                    body: message,
                    icon: UserStore.getUser(userId).avatar
                });

                pluginLogger.info(state);
                pluginLogger.log(
                    // "%s (%s) %s channel %s",
                    // nickname,
                    // displayName,
                    // (oldChannelId && channelId) && oldChannelId !== channelId ? "joined" : !channelId ? "left the" : "moved to",
                    // channel + (oldChannelId ? "from " + ChannelStore.getChannel(oldChannelId).name : ""),
                    // `${nickname} (${displayName}) ${!channelId ? "left" : oldChannelId ? "moved to" : "joined"} ${channelId ? newChannel : oldChannelId ? oldChannel : "N/A"} ${oldChannelId && channelId && !isMe ? `from ${oldChannel} ` : ""}in server ${GuildStore.getGuild(ChannelStore.getChannel(channelId! ?? oldChannelId!).guild_id).name}`
                    message
                );

                createHistoryData(state);
            }
        }
    },

    optionsCache: null as Record<string, PluginOptionsItem> | null,

    get options() {
        return this.optionsCache ??= {
            notification: {
                description: "How often should the notification pop up?",
                type: OptionType.SELECT,
                options: [
                    {
                        label: "Every time",
                        value: NotificationRarity.EveryTime
                    },
                    {
                        label: "Once per server",
                        value: NotificationRarity.OncePerServer
                    },
                    {
                        label: "Once per session",
                        value: NotificationRarity.OncePerSession,
                        default: true
                    },
                    {
                        label: "Never show the reminder",
                        value: NotificationRarity.Never
                    }
                ]
            },
            sizeLimit: {
                description: "History Size Limit",
                type: OptionType.NUMBER,
                default: -1
            },
            persistentData: {
                description: "Keep history on Discord close?",
                type: OptionType.BOOLEAN,
                default: true
            }
        };
    },

    settingsAboutComponent() {
        return (
            <Forms.FormSection >
                <Forms.FormText>
                    Click the button below to clear the local database.
                </Forms.FormText>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "1rem"
                    }}
                >
                    <Button
                        key="clearcache"
                        onClick={() => clearHistoryData()}
                    >
                        Clear Cache
                    </Button>

                    <Forms.FormText>
                        Cache size: {history.length}{Settings.plugins[pluginName].sizeLimit !== -1 ? "/" + Settings.plugins[pluginName].sizeLimit.toString() : ""}
                    </Forms.FormText>
                </div>

                {history.slice(0, 25).map(h => (
                    Test(h)
                    // <Forms.FormText>
                    //     {h.userId === UserStore.getCurrentUser().id ? "You" : GuildMemberStore.getNick(h.guildId!, h.userId) ?? UserStore.getUser(h.userId).username ?? "N/A"} {h.type as string}: {ChannelStore.getChannel(h.channelId!).name} at {formatTimestamp(h.timestamp)}
                    // </Forms.FormText>
                ))}
            </Forms.FormSection>
        );
    }
});
