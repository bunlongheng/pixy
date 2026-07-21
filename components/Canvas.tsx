"use client";
import { useRef, useEffect, useCallback } from "react";
import { type Shape, hitTest, movedShape, resizedShape, rotatedShape, rotateHandlePoint, resizeHandlePoint, CANVAS_W, CANVAS_H, CELL } from "@/lib/shapes";
import { paintScene, paintSelection } from "@/lib/render";

export type Mode = "select" | "draw" | "erase" | "fill";

// Native (OS-drawn) eraser cursor - a pink eraser tilted 45deg. No JS = zero lag.
const ERASER_CURSOR =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cg transform='rotate(45 15 15)'%3E%3Crect x='6' y='10' width='18' height='11' rx='2.5' fill='%23ffffff' stroke='%23ff5fa2' stroke-width='2'/%3E%3Crect x='6' y='10' width='9' height='11' rx='2.5' fill='%23ff9ec7' stroke='%23ff5fa2' stroke-width='2'/%3E%3C/g%3E%3C/svg%3E\") 15 15, crosshair";

type Props = {
    shapes: Shape[];
    selectedId: string | null;
    mode: Mode;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, patch: (s: Shape) => Shape) => void;
    onBeginChange: () => void;
    onStartStroke: () => void;
    onPaint: (cx: number, cy: number) => void;
    onErase: (cx: number, cy: number) => void;
    onFill: (cx: number, cy: number) => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type Drag = { kind: "move" | "resize" | "rotate"; id: string; startX: number; startY: number; shape: Shape; snapped: boolean } | null;
type Paint = { erase: boolean; lastCx: number; lastCy: number } | null;

/** Grid cells along the segment from (x0,y0) to (x1,y1) - Bresenham, so fast strokes leave no gaps. */
function cellsBetween(x0: number, y0: number, x1: number, y1: number): [number, number][] {
    const out: [number, number][] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
        out.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    return out;
}

export function Canvas({ shapes, selectedId, mode, onSelect, onUpdate, onBeginChange, onStartStroke, onPaint, onErase, onFill, canvasRef }: Props) {
    const drag = useRef<Drag>(null);
    const paint = useRef<Paint>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        paintScene(ctx, shapes);
        const sel = shapes.find((s) => s.id === selectedId);
        if (sel && mode === "select") paintSelection(ctx, sel);
    }, [shapes, selectedId, mode, canvasRef]);

    const toCanvas = useCallback(
        (clientX: number, clientY: number): [number, number] => {
            const canvas = canvasRef.current!;
            const r = canvas.getBoundingClientRect();
            return [((clientX - r.left) / r.width) * CANVAS_W, ((clientY - r.top) / r.height) * CANVAS_H];
        },
        [canvasRef],
    );

    const near = (x: number, y: number, p: [number, number], r = CELL) => Math.hypot(x - p[0], y - p[1]) <= r;

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const [x, y] = toCanvas(e.clientX, e.clientY);

        if (mode === "fill") {
            onFill(Math.floor(x / CELL), Math.floor(y / CELL));
            return;
        }

        if (mode === "draw" || mode === "erase") {
            const cx = Math.floor(x / CELL);
            const cy = Math.floor(y / CELL);
            if (mode === "draw") {
                onStartStroke();
                onPaint(cx, cy);
            } else {
                onBeginChange(); // one undo entry per erase gesture
                onErase(cx, cy);
            }
            paint.current = { erase: mode === "erase", lastCx: cx, lastCy: cy };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
        }

        const sel = shapes.find((s) => s.id === selectedId);
        if (sel) {
            if (near(x, y, rotateHandlePoint(sel))) {
                drag.current = { kind: "rotate", id: sel.id, startX: x, startY: y, shape: sel, snapped: false };
                e.currentTarget.setPointerCapture(e.pointerId);
                return;
            }
            if (near(x, y, resizeHandlePoint(sel))) {
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
        const p = paint.current;
        if (p) {
            const [x, y] = toCanvas(e.clientX, e.clientY);
            const cx = Math.floor(x / CELL);
            const cy = Math.floor(y / CELL);
            for (const [gx, gy] of cellsBetween(p.lastCx, p.lastCy, cx, cy)) {
                if (p.erase) onErase(gx, gy);
                else onPaint(gx, gy);
            }
            p.lastCx = cx;
            p.lastCy = cy;
            return;
        }

        const d = drag.current;
        if (!d) return;
        const [x, y] = toCanvas(e.clientX, e.clientY);
        const dx = x - d.startX;
        const dy = y - d.startY;
        if (d.kind !== "rotate" && Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        if (!d.snapped) {
            onBeginChange(); // one undo entry per gesture
            d.snapped = true;
        }
        if (d.kind === "move") onUpdate(d.id, () => movedShape(d.shape, dx, dy));
        else if (d.kind === "resize") {
            // project the drag onto the shape's own (un-rotated) axes so resize feels right when rotated
            const rad = ((d.shape.angle ?? 0) * Math.PI) / 180;
            const ldx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
            const ldy = dx * Math.sin(-rad) + dy * Math.cos(-rad);
            onUpdate(d.id, () => resizedShape(d.shape, d.shape.w + ldx, d.shape.h + ldy));
        } else {
            const ccx = d.shape.x + d.shape.w / 2;
            const ccy = d.shape.y + d.shape.h / 2;
            const deg = (Math.atan2(y - ccy, x - ccx) * 180) / Math.PI + 90; // handle sits above the shape
            onUpdate(d.id, () => rotatedShape(d.shape, deg));
        }
    };

    const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (drag.current || paint.current) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* already released */
            }
        }
        drag.current = null;
        paint.current = null;
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
                cursor: mode === "erase" ? ERASER_CURSOR : mode === "select" ? "pointer" : "crosshair",
            }}
        />
    );
}
