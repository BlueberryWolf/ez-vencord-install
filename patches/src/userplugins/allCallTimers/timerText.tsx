export function TimerText({ text, className }: Readonly<{ text: string; className: string; }>) {
    return <div className={`timeCounter ${className}`} style={{
        // this margin value doesn't change the default size of the user container
        marginTop: -6,
        fontWeight: "bold",
        fontFamily: "monospace",
        // good size that doesn't touch username
        fontSize: 11,
        position: "relative",
    }}>{text}</div>;
}
