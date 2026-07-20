"use client";
import { useRef, useState } from "react";
import { useEditor } from "@/lib/useEditor";
import { exportShapes } from "@/lib/exportImage";
import { TopBar } from "@/components/TopBar";
import { ShapeLibrary } from "@/components/ShapeLibrary";
import { ColorPalette } from "@/components/ColorPalette";
import { Canvas } from "@/components/Canvas";

export default function PixyShapesPage() {
    const ed = useEditor();
    const [mode, setMode] = useState<"move" | "paint">("move");
    const [toast, setToast] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const pickColor = (c: string) => {
        ed.setColor(c);
        if (ed.selectedId) ed.recolor(ed.selectedId, c);
    };

    const doExport = async () => {
        if (ed.shapes.length === 0) {
            setToast("Add a shape first!");
            setTimeout(() => setToast(""), 1800);
            return;
        }
        try {
            const how = await exportShapes(ed.shapes, ed.drawingName);
            setToast(how === "shared" ? "Pick “Save Image” to add to Photos" : "Saved a PNG to your downloads");
        } catch {
            setToast("Could not export - try again");
        }
        setTimeout(() => setToast(""), 2600);
    };

    const btn = (active: boolean): React.CSSProperties => ({
        padding: "8px 14px",
        borderRadius: 10,
        border: `1.5px solid ${active ? "#0068c4" : "#d7dbe3"}`,
        background: active ? "#0068c4" : "white",
        color: active ? "white" : "#374151",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
    });

    return (
        <>
            <style>{`
                .app { display:flex; flex-direction:column; height:100dvh; }
                .toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 16px; background:#fbfcfe; border-bottom:1px solid #e2e6ee; }
                .stage { flex:1; display:flex; min-height:0; }
                .library { width:250px; flex-shrink:0; padding:14px; border-right:1px solid #e2e6ee; background:#f7f9fc; overflow:hidden; }
                .canvas-wrap { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; padding:20px; overflow:auto; }
                @media (max-width: 760px) {
                    .stage { flex-direction:column; }
                    .library { width:auto; height:132px; border-right:none; border-bottom:1px solid #e2e6ee; }
                    .canvas-wrap { padding:12px; }
                }
            `}</style>

            <div className="app">
                <TopBar drawingName={ed.drawingName} setDrawingName={ed.setDrawingName} studentName={ed.studentName} setStudentName={ed.setStudentName} />

                <div className="toolbar">
                    <div role="group" aria-label="Tool mode" style={{ display: "flex", gap: 6, background: "#eef1f6", padding: 4, borderRadius: 12 }}>
                        <button onClick={() => setMode("move")} aria-pressed={mode === "move"} style={btn(mode === "move")}>
                            ✥ Move
                        </button>
                        <button onClick={() => setMode("paint")} aria-pressed={mode === "paint"} style={btn(mode === "paint")}>
                            🪣 Paint
                        </button>
                    </div>

                    <ColorPalette color={ed.color} onPick={pickColor} />

                    <div style={{ flex: 1 }} />

                    <button
                        onClick={() => ed.selectedId && ed.removeShape(ed.selectedId)}
                        disabled={!ed.selectedId}
                        aria-label="Delete selected shape"
                        style={{ ...btn(false), opacity: ed.selectedId ? 1 : 0.4, cursor: ed.selectedId ? "pointer" : "not-allowed" }}
                    >
                        🗑 Delete
                    </button>
                    <button onClick={ed.clearAll} aria-label="Clear canvas" style={btn(false)}>
                        Clear
                    </button>
                    <button
                        onClick={doExport}
                        aria-label="Save to Photos"
                        style={{ ...btn(false), background: "#111827", color: "white", border: "1.5px solid #111827" }}
                    >
                        ⬇ Save to Photos
                    </button>
                </div>

                <main className="stage">
                    <aside className="library">
                        <ShapeLibrary onAdd={ed.addShape} />
                    </aside>
                    <div className="canvas-wrap">
                        <Canvas
                            shapes={ed.shapes}
                            selectedId={ed.selectedId}
                            mode={mode}
                            onSelect={ed.setSelectedId}
                            onUpdate={ed.updateShape}
                            onPaint={(id) => ed.recolor(id, ed.color)}
                            canvasRef={canvasRef}
                        />
                    </div>
                </main>
            </div>

            {toast && (
                <div
                    role="status"
                    style={{
                        position: "fixed",
                        bottom: 22,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#111827",
                        color: "white",
                        padding: "10px 18px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                        zIndex: 100,
                    }}
                >
                    {toast}
                </div>
            )}
        </>
    );
}
