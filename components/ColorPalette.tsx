"use client";
import { PALETTE } from "@/lib/shapes";

export function ColorPalette({ color, onPick }: { color: string; onPick: (c: string) => void }) {
    return (
        <div role="group" aria-label="Colors" style={{ display: "flex", flexWrap: "nowrap", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {PALETTE.map((c) => {
                const active = c.toLowerCase() === color.toLowerCase();
                return (
                    <button
                        key={c}
                        onClick={() => onPick(c)}
                        aria-label={`Color ${c}`}
                        aria-pressed={active}
                        title={c}
                        style={{
                            width: 30,
                            height: 30,
                            flexShrink: 0,
                            borderRadius: 0,
                            background: c,
                            cursor: "pointer",
                            border: "none",
                            boxShadow:
                                [active ? "0 5px 10px rgba(0,0,0,0.3)" : "", c === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : ""]
                                    .filter(Boolean)
                                    .join(", ") || undefined,
                            transform: active ? "translateY(-4px) scale(1.15)" : "scale(1)",
                            transition: "transform 0.1s ease",
                        }}
                    />
                );
            })}
            <label
                style={{ position: "relative", width: 30, height: 30, flexShrink: 0, borderRadius: 0, overflow: "hidden", border: "none", cursor: "pointer" }}
                title="Custom color"
                aria-label="Custom color"
            >
                <span
                    aria-hidden
                    style={{ position: "absolute", inset: 0, background: "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)" }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onPick(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
            </label>
        </div>
    );
}
