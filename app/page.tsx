"use client";
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/lib/useEditor";
import { exportShapes } from "@/lib/exportImage";
import { dateLabel } from "@/lib/shapes";
import { TopBar } from "@/components/TopBar";
import { ShapeLibrary } from "@/components/ShapeLibrary";
import { ColorPalette } from "@/components/ColorPalette";
import { Canvas } from "@/components/Canvas";

export default function PixyShapesPage() {
    const ed = useEditor();
    const [toast, setToast] = useState("");
    const [today, setToday] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => setToday(dateLabel(new Date())), []);

    // Picking a color recolors the selected shape and becomes the color for new shapes.
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
            const how = await exportShapes(ed.shapes, ed.drawingName, { student: ed.studentName, date: today });
            setToast(how === "shared" ? "Pick “Save Image” to add to Photos" : "Saved a PNG to your downloads");
        } catch {
            setToast("Could not export - try again");
        }
        setTimeout(() => setToast(""), 2600);
    };

    const btn: React.CSSProperties = {
        padding: "9px 14px",
        borderRadius: 0,
        border: "2px solid #c3c9d4",
        background: "white",
        color: "#374151",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
    };

    return (
        <>
            <style>{`
                .app { display:flex; flex-direction:column; height:100dvh; }
                .toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 16px; background:#eef1f6; border-bottom:2px solid #d7dbe3; }
                .stage { flex:1; display:flex; min-height:0; }
                .library { width:250px; flex-shrink:0; padding:14px; border-right:2px solid #d7dbe3; background:#f2f4f8; overflow:hidden; }
                .canvas-wrap { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; padding:18px; overflow:auto; background:#dfe3ea; }
                @media (max-width: 760px) {
                    .stage { flex-direction:column; }
                    .library { width:auto; height:130px; border-right:none; border-bottom:2px solid #d7dbe3; }
                    .canvas-wrap { padding:10px; }
                }
            `}</style>

            <div className="app">
                <TopBar
                    drawingName={ed.drawingName}
                    setDrawingName={ed.setDrawingName}
                    studentName={ed.studentName}
                    setStudentName={ed.setStudentName}
                    date={today}
                />

                <div className="toolbar">
                    <ColorPalette color={ed.color} onPick={pickColor} />
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={() => ed.selectedId && ed.removeShape(ed.selectedId)}
                        disabled={!ed.selectedId}
                        aria-label="Delete selected shape"
                        style={{ ...btn, opacity: ed.selectedId ? 1 : 0.4, cursor: ed.selectedId ? "pointer" : "not-allowed" }}
                    >
                        🗑 Delete
                    </button>
                    <button onClick={ed.clearAll} aria-label="Clear canvas" style={btn}>
                        Clear
                    </button>
                    <button
                        onClick={doExport}
                        aria-label="Save to Photos"
                        style={{ ...btn, background: "#111827", color: "white", border: "2px solid #111827" }}
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
                            studentName={ed.studentName}
                            dateStr={today}
                            onSelect={ed.setSelectedId}
                            onUpdate={ed.updateShape}
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
                        borderRadius: 0,
                        fontSize: 14,
                        fontWeight: 700,
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
