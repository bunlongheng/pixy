"use client";
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/lib/useEditor";
import { exportShapes } from "@/lib/exportImage";
import { dateLabel, type Shape } from "@/lib/shapes";
import { TopBar } from "@/components/TopBar";
import { ShapeLibrary } from "@/components/ShapeLibrary";
import { ColorPalette } from "@/components/ColorPalette";
import { Canvas } from "@/components/Canvas";

export default function PixyShapesPage() {
    const ed = useEditor();
    const [toast, setToast] = useState("");
    const [today, setToday] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const edRef = useRef(ed);
    edRef.current = ed;
    const clipboard = useRef<Shape | null>(null);
    useEffect(() => setToday(dateLabel(new Date())), []);

    // Keyboard: undo / copy / paste / duplicate / delete (skip while typing in a field).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
            const meta = e.metaKey || e.ctrlKey;
            const E = edRef.current;
            const k = e.key.toLowerCase();
            if (meta && k === "z" && !typing) {
                e.preventDefault();
                E.undo();
            } else if (meta && k === "c" && !typing && E.selectedId) {
                const s = E.getShape(E.selectedId);
                if (s) clipboard.current = { ...s };
            } else if (meta && (k === "v" || k === "d") && !typing) {
                const src = k === "d" ? E.getShape(E.selectedId) : clipboard.current;
                if (src) {
                    e.preventDefault();
                    E.pasteShape(src);
                }
            } else if ((e.key === "Backspace" || e.key === "Delete") && !typing && E.selectedId) {
                e.preventDefault();
                E.removeShape(E.selectedId);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

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
                .paper { position:relative; display:inline-flex; max-width:100%; max-height:100%; }
                .paper-name { position:absolute; top:2.4%; left:3%; right:3%; display:flex; align-items:baseline; justify-content:space-between; gap:12px; pointer-events:none; border-bottom:2px solid #e6e9f0; padding-bottom:0.8%; }
                @media (max-width: 760px) {
                    .stage { flex-direction:column; }
                    .library { width:auto; height:130px; border-right:none; border-bottom:2px solid #d7dbe3; }
                    .canvas-wrap { padding:10px; }
                }
            `}</style>

            <div className="app">
                <TopBar drawingName={ed.drawingName} setDrawingName={ed.setDrawingName} />

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
                    <button onClick={ed.undo} aria-label="Undo" style={btn} title="Undo (Cmd/Ctrl+Z)">
                        ↩ Undo
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
                        <div className="paper">
                            <Canvas
                                shapes={ed.shapes}
                                selectedId={ed.selectedId}
                                onSelect={ed.setSelectedId}
                                onUpdate={ed.updateShape}
                                onBeginChange={ed.snapshot}
                                canvasRef={canvasRef}
                            />
                            <div className="paper-name">
                                <input
                                    value={ed.studentName}
                                    onChange={(e) => ed.setStudentName(e.target.value)}
                                    aria-label="Student name"
                                    placeholder="Student name"
                                    size={Math.max(4, ed.studentName.length)}
                                    style={{
                                        pointerEvents: "auto",
                                        border: "none",
                                        background: "transparent",
                                        fontWeight: 800,
                                        fontSize: "clamp(15px, 2vw, 26px)",
                                        color: "#1d2530",
                                        outline: "none",
                                        padding: 0,
                                        minWidth: 0,
                                    }}
                                />
                                <span style={{ fontWeight: 700, fontSize: "clamp(11px, 1.5vw, 20px)", color: "#6b7280", whiteSpace: "nowrap" }}>{today}</span>
                            </div>
                        </div>
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
