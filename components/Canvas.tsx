"use client";
import { useRef, useEffect, useCallback } from "react";
import { type Shape, hitTest, movedShape, resizedShape, CANVAS_W, CANVAS_H } from "@/lib/shapes";
import { paintScene, paintSelection, handleRect } from "@/lib/render";

type Props = {
    shapes: Shape[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, patch: (s: Shape) => Shape) => void;
    onBeginChange: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type Drag = { kind: "move" | "resize"; id: string; startX: number; startY: number; shape: Shape; snapped: boolean } | null;

export function Canvas({ shapes, selectedId, onSelect, onUpdate, onBeginChange, canvasRef }: Props) {
    const drag = useRef<Drag>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        paintScene(ctx, shapes);
        const sel = shapes.find((s) => s.id === selectedId);
        if (sel) paintSelection(ctx, sel);
    }, [shapes, selectedId, canvasRef]);

    const toCanvas = useCallback(
        (clientX: number, clientY: number): [number, number] => {
            const canvas = canvasRef.current!;
            const r = canvas.getBoundingClientRect();
            return [((clientX - r.left) / r.width) * CANVAS_W, ((clientY - r.top) / r.height) * CANVAS_H];
        },
        [canvasRef],
    );

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const [x, y] = toCanvas(e.clientX, e.clientY);
        const sel = shapes.find((s) => s.id === selectedId);
        if (sel) {
            const hr = handleRect(sel);
            if (x >= hr.x && x <= hr.x + hr.size && y >= hr.y && y <= hr.y + hr.size) {
                drag.current = { kind: "resize", id: sel.id, startX: x, startY: y, shape: sel, snapped: false };
                e.currentTarget.setPointerCapture(e.pointerId);
                return;
            }
        }
        const hit = hitTest(shapes, x, y);
        if (hit) {
            onSelect(hit.id);
            drag.current = { kind: "move", id: hit.id, startX: x, startY: y, shape: hit, snapped: false };
            e.currentTarget.setPointerCapture(e.pointerId);
        } else {
            onSelect(null);
        }
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const d = drag.current;
        if (!d) return;
        const [x, y] = toCanvas(e.clientX, e.clientY);
        const dx = x - d.startX;
        const dy = y - d.startY;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        if (!d.snapped) {
            onBeginChange(); // one undo entry per drag gesture
            d.snapped = true;
        }
        if (d.kind === "move") onUpdate(d.id, () => movedShape(d.shape, dx, dy));
        else onUpdate(d.id, () => resizedShape(d.shape, d.shape.w + dx, d.shape.h + dy));
    };

    const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (drag.current) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* already released */
            }
        }
        drag.current = null;
    };

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            role="img"
            aria-label="Drawing canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
                background: "#ffffff",
                border: "1px solid #d7dbe3",
                touchAction: "none",
                imageRendering: "pixelated",
                cursor: "pointer",
            }}
        />
    );
}
