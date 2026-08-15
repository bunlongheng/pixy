"use client";
import { useRef, useEffect } from "react";
import { type ShapeType, type Shape, shapeCells, SHAPE_LIBRARY } from "@/lib/shapes";
import { gridStroke } from "@/lib/render";

/** Tiny pixelated preview of a shape type - reuses the real rasterizer, in the live color. */
function MiniShape({ type, color }: { type: ShapeType; color: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const cell = 3; // finer preview grid so detailed shapes (heart, spider...) are recognizable
        // rectangle and lines read as wide bars; everything else fills the square preview.
        const box =
            type === "rectangle"
                ? { x: 3, y: 13, w: 42, h: 22 }
                : type === "line-solid" || type === "line-dash" || type === "line-dot"
                  ? { x: 3, y: 6, w: 42, h: 36 }
                  : { x: 6, y: 6, w: 36, h: 36 };
        const s: Shape = { id: "p", type, ...box, color };
        const fill = color === "#ffffff" ? "#e5e9f0" : color; // white would be invisible on white
        ctx.clearRect(0, 0, 48, 48);
        ctx.fillStyle = fill;
        ctx.strokeStyle = gridStroke(fill);
        ctx.lineWidth = 0.75;
        for (const [cx, cy] of shapeCells(s, cell)) {
            ctx.fillRect(cx * cell, cy * cell, cell, cell);
            ctx.strokeRect(cx * cell + 0.5, cy * cell + 0.5, cell - 1, cell - 1); // per-block grid, like the canvas
        }
    }, [type, color]);
    return <canvas ref={ref} width={48} height={48} aria-hidden style={{ width: 46, height: 46, imageRendering: "pixelated" }} />;
}

export function ShapeLibrary({ onAdd, color }: { onAdd: (type: ShapeType) => void; color: string }) {
    return (
        <section aria-label="Shape library" style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "#6b7280" }}>Shapes</span>
            <div className="shape-grid">
                {SHAPE_LIBRARY.map((s) => (
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
                            padding: "8px 4px",
                            borderRadius: 0,
                            border: "1.5px solid #e2e6ee",
                            background: "white",
                            cursor: "pointer",
                            transition: "transform 0.1s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        <MiniShape type={s.type} color={color} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", textAlign: "center", lineHeight: 1.1 }}>{s.name}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
