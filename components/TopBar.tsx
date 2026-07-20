"use client";
import { useState, useEffect } from "react";
import { dateLabel } from "@/lib/shapes";

type Props = {
    drawingName: string;
    setDrawingName: (v: string) => void;
    studentName: string;
    setStudentName: (v: string) => void;
};

export function TopBar({ drawingName, setDrawingName, studentName, setStudentName }: Props) {
    // compute date on the client only, to avoid SSR/client hydration mismatch
    const [today, setToday] = useState("");
    useEffect(() => setToday(dateLabel(new Date())), []);

    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                padding: "10px 16px",
                background: "linear-gradient(180deg,#ffffff,#f4f6fa)",
                borderBottom: "1px solid #e2e6ee",
            }}
        >
            <div aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>
                🟦
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <label htmlFor="drawing-name" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#9aa5b1" }}>
                    Drawing
                </label>
                <input
                    id="drawing-name"
                    value={drawingName}
                    onChange={(e) => setDrawingName(e.target.value)}
                    placeholder="My Drawing"
                    style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#1d1d1f",
                        outline: "none",
                        padding: 0,
                        minWidth: 120,
                        letterSpacing: -0.3,
                    }}
                />
            </div>

            <div style={{ flex: 1 }} />

            {/* Student name + date, silver */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "linear-gradient(180deg,#f7f8fa 0%,#dfe3ea 55%,#c3c9d4 100%)",
                    border: "1px solid #c3c9d4",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.06)",
                }}
            >
                <label htmlFor="student-name" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280" }}>
                    Student
                </label>
                <input
                    id="student-name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Name"
                    style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#3a4150",
                        outline: "none",
                        padding: 0,
                        width: `${Math.max(6, studentName.length)}ch`,
                        textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                    }}
                />
                <span aria-hidden style={{ color: "#9aa5b1" }}>
                    ·
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#5a6270", textShadow: "0 1px 0 rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                    {today || " "}
                </span>
            </div>
        </header>
    );
}
