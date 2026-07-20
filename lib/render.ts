import { type Shape, shapeCells, CELL, CANVAS_W, CANVAS_H } from "@/lib/shapes";

/** Paint the whole scene (white sheet + pixel-block shapes) into a 2D context. */
export function paintScene(ctx: CanvasRenderingContext2D, shapes: Shape[], cell = CELL) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    for (const s of shapes) {
        ctx.fillStyle = s.color;
        for (const [cx, cy] of shapeCells(s, cell)) {
            ctx.fillRect(cx * cell, cy * cell, cell, cell);
        }
    }
}

/** Draw the selection outline + resize handle for one shape (editor only, never exported). */
export function paintSelection(ctx: CanvasRenderingContext2D, s: Shape, cell = CELL) {
    ctx.save();
    ctx.strokeStyle = "#0aa5ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4);
    ctx.setLineDash([]);
    // resize handle, bottom-right
    const hs = cell * 1.5;
    ctx.fillStyle = "#0aa5ff";
    ctx.fillRect(s.x + s.w - hs / 2, s.y + s.h - hs / 2, hs, hs);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x + s.w - hs / 2 + 3, s.y + s.h - hs / 2 + 3, hs - 6, hs - 6);
    ctx.restore();
}

/** Handle bounds (canvas coords) for the bottom-right resize grip. */
export function handleRect(s: Shape, cell = CELL) {
    const hs = cell * 1.5;
    return { x: s.x + s.w - hs / 2, y: s.y + s.h - hs / 2, size: hs };
}

export { CANVAS_W, CANVAS_H, CELL };
