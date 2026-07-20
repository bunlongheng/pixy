"use client";

type Props = {
    drawingName: string;
    setDrawingName: (v: string) => void;
    studentName: string;
    setStudentName: (v: string) => void;
    date: string;
};

const field: React.CSSProperties = {
    border: "2px solid #d7dbe3",
    background: "white",
    fontSize: 14,
    fontWeight: 700,
    color: "#1d2530",
    outline: "none",
    padding: "6px 10px",
    borderRadius: 0,
};

export function TopBar({ drawingName, setDrawingName, studentName, setStudentName, date }: Props) {
    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                padding: "10px 16px",
                background: "#fbfcfe",
                borderBottom: "2px solid #d7dbe3",
            }}
        >
            <div aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>
                🟦
            </div>
            <label htmlFor="drawing-name" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280" }}>
                Drawing
            </label>
            <input
                id="drawing-name"
                value={drawingName}
                onChange={(e) => setDrawingName(e.target.value)}
                placeholder="My Drawing"
                style={{ ...field, fontSize: 16, fontWeight: 800, minWidth: 140 }}
            />

            <div style={{ flex: 1 }} />

            <label htmlFor="student-name" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280" }}>
                Student
            </label>
            <input
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Name"
                style={{ ...field, width: `${Math.max(8, studentName.length + 1)}ch` }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>{date || " "}</span>
        </header>
    );
}
