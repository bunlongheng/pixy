"use client";
import { useState, useRef, useEffect } from "react";
import { type ShapeType, type Shape, shapeCells, searchShapes } from "@/lib/shapes";

/** Tiny pixelated preview of a shape type - reuses the real rasterizer. */
function MiniShape({ type }: { type: ShapeType }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const cell = 6;
        const s: Shape = { id: "p", type, x: 6, y: 6, w: 36, h: 36, color: "#3b82f6" };
        ctx.clearRect(0, 0, 48, 48);
        ctx.fillStyle = s.color;
        for (const [cx, cy] of shapeCells(s, cell)) ctx.fillRect(cx * cell, cy * cell, cell, cell);
    }, [type]);
    return <canvas ref={ref} width={48} height={48} aria-hidden style={{ width: 40, height: 40, imageRendering: "pixelated" }} />;
}

export function ShapeLibrary({ onAdd }: { onAdd: (type: ShapeType) => void }) {
    const [query, setQuery] = useState("");
    const results = searchShapes(query);

    return (
        <section aria-label="Shape library" style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
            <label htmlFor="shape-search" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "#6b7280" }}>
                Shapes
            </label>
            <input
                id="shape-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shapes…"
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #d7dbe3",
                    background: "white",
                    fontSize: 14,
                    outline: "none",
                }}
            />
            <div
                style={{
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                    gap: 8,
                    paddingRight: 2,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                {results.map((s) => (
                    <button
                        key={s.type}
                        onClick={() => onAdd(s.type)}
                        aria-label={`Add ${s.name} to canvas`}
                        title={`Add ${s.name}`}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            padding: "10px 6px",
                            borderRadius: 12,
                            border: "1.5px solid #e2e6ee",
                            background: "white",
                            cursor: "pointer",
                            transition: "transform 0.1s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        <MiniShape type={s.type} />
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#4b5563", textAlign: "center", lineHeight: 1.1 }}>{s.name}</span>
                    </button>
                ))}
                {results.length === 0 && <p style={{ fontSize: 12, color: "#9aa5b1", gridColumn: "1 / -1", padding: 8 }}>No shapes match “{query}”.</p>}
            </div>
        </section>
    );
}
