import { React, Tooltip, useEffect, useState } from "@webpack/common";

import { settings } from "./index";
import { TimerIcon } from "./TimerIcon";
import { TimerText } from "./timerText";


interface FixedTimerOpts {
    interval?: number;
    initialTime?: number;
}

export function useFixedTimer({ interval = 1000, initialTime = Date.now() }: FixedTimerOpts) {
    const [time, setTime] = useState(Date.now() - initialTime);

    useEffect(() => {
        const intervalId = setInterval(() => setTime(Date.now() - initialTime), interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [initialTime]);

    return time;
}

/**
 * The `formatDurationMs` function formats a duration in milliseconds into a human-readable string,
 * with the option to include units such as days, hours, minutes, and seconds.
 * @param {number} ms - The `ms` parameter represents the duration in milliseconds that you want to
 * format.
 * @param {boolean} [human=false] - The `human` parameter is a boolean flag that determines whether the
 * duration should be formatted in a human-readable format or not. If `human` is set to `true`, the
 * duration will be formatted as "Xd Xh Xm Xs". If `human` is set to `false` (the default), the
 * duration will be formatted as "XX:XX:XX:XX".
 * @returns The function `formatDurationMs` returns a formatted string representing the duration in
 * milliseconds.
 */
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
