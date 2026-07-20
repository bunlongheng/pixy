"use client";

type Props = {
    drawingName: string;
    setDrawingName: (v: string) => void;
};

export function TopBar({ drawingName, setDrawingName }: Props) {
    return (
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#fbfcfe", borderBottom: "2px solid #d7dbe3" }}>
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
                style={{
                    border: "2px solid #d7dbe3",
                    background: "white",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1d2530",
                    outline: "none",
                    padding: "6px 10px",
                    borderRadius: 0,
                    minWidth: 160,
                }}
            />
        </header>
    );
}
