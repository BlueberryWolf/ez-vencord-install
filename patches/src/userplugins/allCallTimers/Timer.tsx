/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Tooltip, useEffect, useState } from "@webpack/common";

import { settings } from "./index";
import { TimerIcon } from "./TimerIcon";
import { TimerText } from "./timerText";

interface FixedTimerOpts {
    interval?: number;
    initialTime?: number;
}

function useFixedTimer({ interval = 1000, initialTime = Date.now() }: FixedTimerOpts) {
    const [time, setTime] = useState(Date.now() - initialTime);

    useEffect(() => {
        const intervalId = setInterval(() => setTime(Date.now() - initialTime), interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [initialTime]);

    return time;
}

function formatDurationMs(ms: number, human: boolean = false, seconds: boolean = true) {
    const format = (n: number) => human ? n : n.toString().padStart(2, "0");
    const unit = (s: string) => human ? s : "";
    const delim = human ? " " : ":";

    // thx copilot
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor(((ms % 86400000) % 3600000) / 60000);
    const s = Math.floor((((ms % 86400000) % 3600000) % 60000) / 1000);

    let res = "";
    if (d) res += `${d}${unit("d")}${delim}`;
    if (h || res || !seconds) res += `${format(h)}${unit("h")}${delim}`;
    if (m || res || !human || !seconds) res += `${format(m)}${unit("m")}`;
    if (seconds && (m || res || !human)) res += `${delim}`;
    if (seconds) res += `${format(s)}${unit("s")}`;

    return res;
}

export function Timer({ time }: Readonly<{ time: number; }>) {
    const durationMs = useFixedTimer({ initialTime: time });
    const formatted = formatDurationMs(durationMs, settings.store.format === "human", settings.store.showSeconds);
    const defaultColorClassName = settings.store.showRoleColor ? "" : "usernameFont__71dd5 username__73ce9";

    if (settings.store.showWithoutHover) {
        return <TimerText text={formatted} className={defaultColorClassName} />;
    } else {
        // show as a tooltip
        return (
            <Tooltip text={formatted}>
                {({ onMouseEnter, onMouseLeave }) => (
                    <div
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        role="tooltip"
                    >
                        <TimerIcon />
                    </div>
                )}
            </Tooltip>
        );
    }
}
