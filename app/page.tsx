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
    const [confirmClear, setConfirmClear] = useState(false);
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

    // Esc closes the clear-confirm modal.
    useEffect(() => {
        if (!confirmClear) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setConfirmClear(false);
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [confirmClear]);

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
            const how = await exportShapes(ed.shapes, ed.drawingName, { title: ed.drawingName, student: ed.studentName, date: today });
            setToast(how === "shared" ? "Pick “Save Image” to add to Photos" : "Saved a PNG to your downloads");
        } catch {
            setToast("Could not export - try again");
        }
        setTimeout(() => setToast(""), 2600);
    };

    // Big, flat white-on-color buttons with a white line icon. Active tools darken.
    const bigBtn = (bg: string, active = false): React.CSSProperties => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "12px 20px",
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

    const Icon = ({ d }: { d: string }) => (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ flexShrink: 0 }}
        >
            <path d={d} />
        </svg>
    );
    const ICON = {
        draw: "M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
        fill: "M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z",
        erase: "M7 21l-4.3-4.3a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 0 2.8L13 21 M22 21H7 M5 11l8 8",
        delete: "M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6",
        undo: "M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",
        clear: "M18 6 6 18 M6 6l12 12",
        save: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    };

    return (
        <>
            <style>{`
                .app { display:flex; flex-direction:column; height:100dvh; }
                .toolbar { display:flex; align-items:center; gap:12px; flex-wrap:nowrap; overflow-x:auto; padding:10px 16px; background:#eef1f6; border-bottom:2px solid #d7dbe3; }
                .stage { flex:1; display:flex; min-height:0; }
                .library { width:340px; flex-shrink:0; padding:14px; border-right:2px solid #d7dbe3; background:#f2f4f8; overflow:hidden; }
                .canvas-wrap { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; padding:18px; overflow:auto; background:#dfe3ea; }
                .paper { position:relative; display:inline-flex; max-width:100%; max-height:100%; }
                .paper-name { position:absolute; top:4.2%; left:2.6%; right:2.6%; display:flex; align-items:baseline; justify-content:space-between; gap:12px; pointer-events:none; }
                @media (max-width: 760px) {
                    .stage { flex-direction:column; }
                    .library { width:auto; height:130px; border-right:none; border-bottom:2px solid #d7dbe3; }
                    .canvas-wrap { padding:10px; }
                }
            `}</style>

            <div className="app">
                <TopBar />

                <div className="toolbar">
                    <ColorPalette color={ed.color} onPick={pickColor} />
                    <div style={{ flex: 1, minWidth: 12 }} />
                    <button
                        onClick={() => toggleMode("draw")}
                        aria-pressed={mode === "draw"}
                        aria-label="Draw freehand"
                        style={bigBtn("#0aa5ff", mode === "draw")}
                    >
                        <Icon d={ICON.draw} />
                        Draw
                    </button>
                    <button
                        onClick={() => toggleMode("fill")}
                        aria-pressed={mode === "fill"}
                        aria-label="Paint bucket fill"
                        style={bigBtn("#2ecc40", mode === "fill")}
                    >
                        <Icon d={ICON.fill} />
                        Fill
                    </button>
                    <button onClick={() => toggleMode("erase")} aria-pressed={mode === "erase"} aria-label="Erase" style={bigBtn("#ff5fa2", mode === "erase")}>
                        <Icon d={ICON.erase} />
                        Erase
                    </button>
                    <button
                        onClick={() => ed.selectedId && ed.removeShape(ed.selectedId)}
                        disabled={!ed.selectedId}
                        aria-label="Delete selected shape"
                        style={{ ...bigBtn("#e11d2a"), opacity: ed.selectedId ? 1 : 0.4, cursor: ed.selectedId ? "pointer" : "not-allowed" }}
                    >
                        <Icon d={ICON.delete} />
                        Delete
                    </button>
                    <button onClick={ed.undo} aria-label="Undo" title="Undo (Cmd/Ctrl+Z)" style={bigBtn("#8e44ec")}>
                        <Icon d={ICON.undo} />
                        Undo
                    </button>
                    <button onClick={() => (ed.shapes.length ? setConfirmClear(true) : null)} aria-label="Clear canvas" style={bigBtn("#64748b")}>
                        <Icon d={ICON.clear} />
                        Clear
                    </button>
                    <button onClick={doExport} aria-label="Save to Photos" style={bigBtn("#111827")}>
                        <Icon d={ICON.save} />
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
                                    value={ed.drawingName}
                                    onChange={(e) => ed.setDrawingName(e.target.value)}
                                    aria-label="Drawing title"
                                    placeholder="My Drawing"
                                    className="autosize"
                                    size={Math.max(6, Math.round(ed.drawingName.length * 1.35) + 2)}
                                    style={{
                                        pointerEvents: "auto",
                                        border: "none",
                                        background: "transparent",
                                        fontFamily: HAND_FONT,
                                        fontWeight: 700,
                                        fontSize: "clamp(16px, 2vw, 28px)",
                                        lineHeight: 1.6,
                                        color: "#1d2530",
                                        outline: "none",
                                        padding: "4px 2px",
                                        minWidth: 0,
                                    }}
                                />
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                                    <input
                                        value={ed.studentName}
                                        onChange={(e) => ed.setStudentName(e.target.value)}
                                        aria-label="Student name"
                                        placeholder="Student name"
                                        className="autosize"
                                        size={Math.max(6, Math.round(ed.studentName.length * 1.35) + 2)}
                                        style={{
                                            pointerEvents: "auto",
                                            textAlign: "right",
                                            border: "none",
                                            background: "transparent",
                                            fontFamily: HAND_FONT,
                                            fontWeight: 700,
                                            fontSize: "clamp(12px, 1.4vw, 19px)",
                                            lineHeight: 1.6,
                                            color: "#1d2530",
                                            outline: "none",
                                            padding: "4px 2px",
                                            minWidth: 0,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: HAND_FONT,
                                            fontWeight: 700,
                                            fontSize: "clamp(10px, 1.1vw, 14px)",
                                            color: "#9aa5b1",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {today}
                                    </span>
                                </div>
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

            {confirmClear && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Clear the drawing?"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(17,24,39,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 200,
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            padding: "26px 26px 22px",
                            maxWidth: 380,
                            width: "100%",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#1d2530", marginBottom: 8 }}>Clear the whole drawing?</div>
                        <div style={{ fontSize: 17, color: "#6b7280", marginBottom: 22 }}>This erases everything on the paper. You can still Undo after.</div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button onClick={() => setConfirmClear(false)} style={bigBtn("#9aa5b1")}>
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    ed.clearAll();
                                    setConfirmClear(false);
                                }}
                                style={bigBtn("#e11d2a")}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
