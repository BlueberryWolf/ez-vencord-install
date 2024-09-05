/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Write your component below!

import { Forms } from "@webpack/common";

import { formatTimestamp, HistoryData, retrieveHistoryData } from ".";

export default function Test(history: HistoryData) {
    const { username, displayName, channelName, oldChannelName, guildName, avatarUrl, typeString } = retrieveHistoryData(history);
    const time = history.timestamp;

    return (
        <section>
            <HistoryItem
                user={username}
                displayName={displayName}
                newChannel={channelName}
                oldChannel={oldChannelName}
                guild={guildName}
                time={time}
                avatarUrl={avatarUrl}
                type={typeString}
            />
        </section>
    );
}

function HistoryItem({ user, displayName, newChannel, oldChannel, guild, time, avatarUrl, type }) {
    return (
        <div style={{ display: "flex" }}>
            <img
                src={avatarUrl}
                width="64"
                height="64"
                style={{ borderRadius: "50%" }}
            />
            <section>
                <HistoryDate
                    server={guild}
                    date={formatTimestamp(time)}
                />
                <Forms.FormText>
                    {user} ({displayName}) {type} '<b><u>{newChannel}</u></b>' {oldChannel ? `from <b><u>${oldChannel}</u></b>' ` : ""}in server '<b><u>{guild}</u></b>'
                </Forms.FormText>
            </section>
        </div>
    );
}

function HistoryDate({ server, date }) {
    return (
        <Forms.FormText
            variant="text-sm/semibold"
            style={{ color: "var(--header-secondary)" }}
        >
            {server} - {date}
        </Forms.FormText>
    );
}
