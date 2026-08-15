"use client";
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/lib/useEditor";
import { exportShapes } from "@/lib/exportImage";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { ShapeLibrary } from "@/components/ShapeLibrary";
import { Toolbar } from "@/components/Toolbar";
import { Canvas, type Mode } from "@/components/Canvas";

export default function PixyPage() {
    const ed = useEditor();
    const [toast, setToast] = useState("");
    const [mode, setMode] = useState<Mode>("select");
    const [confirmClear, setConfirmClear] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useKeyboardShortcuts(ed);

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
            const how = await exportShapes(ed.shapes, ed.drawingName, { title: "", student: "", date: "" });
            setToast(how === "shared" ? "Pick “Save Image” to add to Photos" : "Saved a PNG to your downloads");
        } catch {
            setToast("Could not export - try again");
        }
        setTimeout(() => setToast(""), 2600);
    };

    return (
        <>
            <style>{`
                .app { display:flex; flex-direction:column; height:100dvh; }
                .toolbar { display:flex; align-items:center; gap:10px; flex-wrap:nowrap; overflow-x:auto; padding:8px 14px; background:#eef1f6; border-bottom:2px solid #d7dbe3; }
                .brand { display:flex; align-items:center; gap:8px; flex-shrink:0; }
                .tb-spacer { flex:1; min-width:10px; }
                .stage { flex:1; display:flex; min-height:0; }
                .library { width:150px; flex-shrink:0; padding:8px; border-right:2px solid #d7dbe3; background:#f2f4f8; overflow:hidden; }
                .canvas-wrap { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; padding:6px; overflow:auto; background:#dfe3ea; }
                .paper { position:relative; display:inline-flex; max-width:100%; max-height:100%; }
                @media (max-width: 760px) {
                    .toolbar { flex-wrap:wrap; overflow-x:visible; row-gap:10px; }
                    .tb-spacer { flex-basis:100%; min-width:0; height:0; }
                    .stage { flex-direction:column; }
                    .library { width:auto; height:150px; flex-shrink:0; border-right:none; border-bottom:2px solid #d7dbe3; }
                    .canvas-wrap { padding:6px; }
                }
            `}</style>

            <div className="app">
                <Toolbar
                    color={ed.color}
                    onPick={pickColor}
                    mode={mode}
                    onToggleMode={toggleMode}
                    canDelete={!!ed.selectedId}
                    onDelete={() => ed.selectedId && ed.removeShape(ed.selectedId)}
                    onUndo={ed.undo}
                    onClear={() => (ed.shapes.length ? setConfirmClear(true) : null)}
                    onSave={doExport}
                />

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
                            <button onClick={() => setConfirmClear(false)} style={modalBtn("#9aa5b1")}>
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    ed.clearAll();
                                    setConfirmClear(false);
                                }}
                                style={modalBtn("#e11d2a")}
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

// Confirm-dialog buttons keep a color (safe gray vs destructive red) - this is a deliberate
// yes/no decision, not a tool, so color communicates intent here.
const modalBtn = (bg: string): React.CSSProperties => ({
    padding: "10px 20px",
    border: "none",
    borderRadius: 0,
    background: bg,
    color: "white",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
});
