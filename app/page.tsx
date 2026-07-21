"use client";
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/lib/useEditor";
import { exportShapes } from "@/lib/exportImage";
import { dateLabel, type Shape } from "@/lib/shapes";
import { TopBar } from "@/components/TopBar";
import { ShapeLibrary } from "@/components/ShapeLibrary";
import { ColorPalette } from "@/components/ColorPalette";
import { Canvas, type Mode } from "@/components/Canvas";
import { HAND_FONT } from "@/lib/render";

export default function PixyPage() {
    const ed = useEditor();
    const [toast, setToast] = useState("");
    const [today, setToday] = useState("");
    const [mode, setMode] = useState<Mode>("select");
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

    const toggleMode = (m: Mode) => {
        setMode((cur) => (cur === m ? "select" : m));
        ed.setSelectedId(null);
    };

    const addShape = (type: Parameters<typeof ed.addShape>[0]) => {
        setMode("select"); // dropping a shape returns to select so it can be moved/rotated
        ed.addShape(type);
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

    // Big, flat white-on-color buttons: no icons, no borders. Active tools darken.
    const bigBtn = (bg: string, active = false): React.CSSProperties => ({
        padding: "12px 22px",
        borderRadius: 0,
        border: "none",
        background: bg,
        color: "white",
        fontSize: 20,
        fontWeight: 900,
        letterSpacing: 0.5,
        lineHeight: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "pointer",
        filter: active ? "brightness(0.78)" : "none",
    });

    return (
        <>
            <style>{`
                .app { display:flex; flex-direction:column; height:100dvh; }
                .toolbar { display:flex; align-items:center; gap:12px; flex-wrap:nowrap; overflow-x:auto; padding:10px 16px; background:#eef1f6; border-bottom:2px solid #d7dbe3; }
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
                    <div style={{ flex: 1, minWidth: 12 }} />
                    <button
                        onClick={() => toggleMode("draw")}
                        aria-pressed={mode === "draw"}
                        aria-label="Draw freehand"
                        style={bigBtn("#0aa5ff", mode === "draw")}
                    >
                        Draw
                    </button>
                    <button
                        onClick={() => toggleMode("fill")}
                        aria-pressed={mode === "fill"}
                        aria-label="Paint bucket fill"
                        style={bigBtn("#2ecc40", mode === "fill")}
                    >
                        Fill
                    </button>
                    <button onClick={() => toggleMode("erase")} aria-pressed={mode === "erase"} aria-label="Erase" style={bigBtn("#ff5fa2", mode === "erase")}>
                        Erase
                    </button>
                    <button
                        onClick={() => ed.selectedId && ed.removeShape(ed.selectedId)}
                        disabled={!ed.selectedId}
                        aria-label="Delete selected shape"
                        style={{ ...bigBtn("#e11d2a"), opacity: ed.selectedId ? 1 : 0.4, cursor: ed.selectedId ? "pointer" : "not-allowed" }}
                    >
                        Delete
                    </button>
                    <button onClick={ed.undo} aria-label="Undo" title="Undo (Cmd/Ctrl+Z)" style={bigBtn("#8e44ec")}>
                        Undo
                    </button>
                    <button onClick={ed.clearAll} aria-label="Clear canvas" style={bigBtn("#9aa5b1")}>
                        Clear
                    </button>
                    <button onClick={doExport} aria-label="Save to Photos" style={bigBtn("#111827")}>
                        Save
                    </button>
                </div>

                <main className="stage">
                    <aside className="library">
                        <ShapeLibrary onAdd={addShape} color={ed.color} />
                    </aside>
                    <div className="canvas-wrap">
                        <div className="paper">
                            <Canvas
                                shapes={ed.shapes}
                                selectedId={ed.selectedId}
                                mode={mode}
                                onSelect={ed.setSelectedId}
                                onUpdate={ed.updateShape}
                                onBeginChange={ed.snapshot}
                                onStartStroke={ed.startStroke}
                                onPaint={ed.paintCell}
                                onErase={ed.eraseCell}
                                onFill={ed.fill}
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
                                        fontFamily: HAND_FONT,
                                        fontWeight: 700,
                                        fontSize: "clamp(17px, 2.2vw, 30px)",
                                        color: "#1d2530",
                                        outline: "none",
                                        padding: 0,
                                        minWidth: 0,
                                    }}
                                />
                                <span style={{ fontWeight: 700, fontSize: "clamp(10px, 1.35vw, 18px)", color: "#6b7280", whiteSpace: "nowrap" }}>{today}</span>
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
