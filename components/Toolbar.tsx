"use client";
import Image from "next/image";
import { ColorPalette } from "@/components/ColorPalette";
import type { Mode } from "@/components/Canvas";

type Props = {
    color: string;
    onPick: (c: string) => void;
    mode: Mode;
    onToggleMode: (m: Mode) => void;
    canDelete: boolean;
    onDelete: () => void;
    onUndo: () => void;
    onClear: () => void;
    onSave: () => void;
};

// Neutral, icon-only toolbar: no per-button color association (confuses kids into thinking a
// tool "is" a color). Every tool button is the same slate tone; the icon carries the meaning
// (aria-label + title name it), and the active tool reads as darker + a ring, never a color.
const NEUTRAL = "#3b4557";
const btn = (active = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 14px",
    borderRadius: 0,
    border: active ? "3px solid #111827" : "3px solid transparent",
    background: active ? "#1d2530" : NEUTRAL,
    color: "white",
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
    cursor: "pointer",
});

const ICON = {
    draw: "M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
    fill: "M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z",
    erase: "M7 21l-4.3-4.3a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 0 2.8L13 21 M22 21H7 M5 11l8 8",
    delete: "M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6",
    undo: "M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",
    clear: "M18 6 6 18 M6 6l12 12",
    save: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
};

const Icon = ({ d }: { d: string }) => (
    <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{ flexShrink: 0 }}
    >
        <path d={d} />
    </svg>
);

export function Toolbar({ color, onPick, mode, onToggleMode, canDelete, onDelete, onUndo, onClear, onSave }: Props) {
    return (
        <div className="toolbar">
            <div className="brand">
                <Image src="/mark.png" alt="Pixy" width={30} height={30} priority style={{ borderRadius: 6, display: "block" }} />
                <span style={{ fontSize: 22, fontWeight: 800, color: "#1d2530", letterSpacing: 0.5 }}>Pixy</span>
            </div>
            <ColorPalette color={color} onPick={onPick} />
            <div className="tb-spacer" />
            <button onClick={() => onToggleMode("draw")} aria-pressed={mode === "draw"} aria-label="Draw freehand" title="Draw" style={btn(mode === "draw")}>
                <Icon d={ICON.draw} />
            </button>
            <button
                onClick={() => onToggleMode("fill")}
                aria-pressed={mode === "fill"}
                aria-label="Paint bucket fill"
                title="Fill"
                style={btn(mode === "fill")}
            >
                <Icon d={ICON.fill} />
            </button>
            <button onClick={() => onToggleMode("erase")} aria-pressed={mode === "erase"} aria-label="Erase" title="Erase" style={btn(mode === "erase")}>
                <Icon d={ICON.erase} />
            </button>
            <button
                onClick={onDelete}
                disabled={!canDelete}
                aria-label="Delete selected shape"
                title="Delete"
                style={{ ...btn(), opacity: canDelete ? 1 : 0.4, cursor: canDelete ? "pointer" : "not-allowed" }}
            >
                <Icon d={ICON.delete} />
            </button>
            <button onClick={onUndo} aria-label="Undo" title="Undo (Cmd/Ctrl+Z)" style={btn()}>
                <Icon d={ICON.undo} />
            </button>
            <button onClick={onClear} aria-label="Clear canvas" title="Clear" style={btn()}>
                <Icon d={ICON.clear} />
            </button>
            <button onClick={onSave} aria-label="Save to Photos" title="Save" style={btn()}>
                <Icon d={ICON.save} />
            </button>
        </div>
    );
}
