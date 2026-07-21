"use client";
import Image from "next/image";

export function TopBar() {
    return (
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", background: "#fbfcfe", borderBottom: "2px solid #d7dbe3" }}>
            <Image src="/mark.png" alt="Pixy" width={34} height={34} priority style={{ borderRadius: 7, display: "block" }} />
            <span style={{ fontSize: 26, fontWeight: 800, color: "#1d2530", letterSpacing: 0.5 }}>Pixy</span>
        </header>
    );
}
