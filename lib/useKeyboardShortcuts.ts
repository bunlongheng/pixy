"use client";
import { useEffect, useRef } from "react";
import type { Shape } from "@/lib/shapes";
import type { useEditor } from "@/lib/useEditor";

type Editor = ReturnType<typeof useEditor>;

/**
 * Global editor shortcuts: undo (Cmd/Ctrl+Z), copy (Cmd/Ctrl+C), paste (Cmd/Ctrl+V),
 * duplicate (Cmd/Ctrl+D), and delete (Backspace/Delete). Skipped while typing in a field.
 * Reads the latest editor through a ref so the listener is bound once.
 */
export function useKeyboardShortcuts(ed: Editor) {
    const edRef = useRef(ed);
    edRef.current = ed;
    const clipboard = useRef<Shape | null>(null);

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
}
