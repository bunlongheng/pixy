"use client";
import { PALETTE } from "@/lib/shapes";

export function ColorPalette({ color, onPick }: { color: string; onPick: (c: string) => void }) {
    return (
        <div role="group" aria-label="Colors" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
                            borderRadius: 0,
                            background: c,
                            cursor: "pointer",
                            border: active ? "3px solid #111827" : "2px solid rgba(0,0,0,0.18)",
                            boxShadow: c === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
                            transform: active ? "scale(1.12)" : "scale(1)",
                            transition: "transform 0.1s ease",
                        }}
                    />
                );
            })}
            <label
                style={{ position: "relative", width: 30, height: 30, borderRadius: 0, overflow: "hidden", border: "2px dashed #9aa5b1", cursor: "pointer" }}
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
