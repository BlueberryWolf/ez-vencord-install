export interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
    guildId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
    selfStream: boolean;
    selfVideo: boolean;
    sessionId: string;
    suppress: boolean;
    requestToSpeakTimestamp: string | null;
}

export interface PassiveUpdateState {
    type: string;
    guildId: string;
    members?: ({
        user: {
            avatar: null | string;
            communication_disabled_until: null | string;
            deaf: boolean;
            flags: number;
            joined_at: string;
            mute: boolean;
            nick: string;
            pending: boolean;
            premium_since: null | string;
        };
        roles: (string)[];
        premium_since: null | string;
        pending: boolean;
        nick: string | null;
        mute: boolean;
        joined_at: string;
        flags: number;
        deaf: boolean;
        communication_disabled_until: null | string;
        avatar: null | string;
    })[];
    channels: ({
        lastPinTimestamp?: string;
        lastMessageId: string;
        id: string;
    })[];
    voiceStates?: VoiceState[];
}
