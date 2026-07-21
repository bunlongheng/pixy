"use client";
import Image from "next/image";
import { HAND_FONT } from "@/lib/render";

type Props = {
    drawingName: string;
    setDrawingName: (v: string) => void;
};

export function TopBar({ drawingName, setDrawingName }: Props) {
    return (
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#fbfcfe", borderBottom: "2px solid #d7dbe3" }}>
            <Image src="/mark.png" alt="Pixy" width={28} height={28} priority style={{ borderRadius: 6, display: "block" }} />
            <input
                id="drawing-name"
                value={drawingName}
                onChange={(e) => setDrawingName(e.target.value)}
                placeholder="My Drawing"
                aria-label="Drawing name"
                style={{
                    border: "2px solid #d7dbe3",
                    background: "white",
                    fontFamily: HAND_FONT,
                    fontSize: 22,
                    fontWeight: 700,
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
