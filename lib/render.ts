import { type Shape, shapeCells, CELL, CANVAS_W, CANVAS_H } from "@/lib/shapes";

export type Nameplate = { student: string; date: string };

/** Paint the whole scene: white sheet + optional name header + pixel-block shapes. */
export function paintScene(ctx: CanvasRenderingContext2D, shapes: Shape[], nameplate?: Nameplate, cell = CELL) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (nameplate && (nameplate.student.trim() || nameplate.date)) {
        ctx.save();
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#1d2530";
        ctx.font = "700 34px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
        ctx.textAlign = "left";
        if (nameplate.student.trim()) ctx.fillText(nameplate.student, 40, 58);
        ctx.fillStyle = "#6b7280";
        ctx.font = "600 24px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
        ctx.textAlign = "right";
        if (nameplate.date) ctx.fillText(nameplate.date, CANVAS_W - 40, 56);
        ctx.strokeStyle = "#e2e6ee";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 78);
        ctx.lineTo(CANVAS_W - 40, 78);
        ctx.stroke();
        ctx.restore();
    }

    for (const s of shapes) {
        ctx.fillStyle = s.color;
        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.lineWidth = 1;
        for (const [cx, cy] of shapeCells(s, cell)) {
            const x = cx * cell;
            const y = cy * cell;
            ctx.fillRect(x, y, cell, cell);
            ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1); // subtle per-block grid
        }
    }
}

/** Draw the selection outline + resize handle for one shape (editor only, never exported). */
export function paintSelection(ctx: CanvasRenderingContext2D, s: Shape, cell = CELL) {
    ctx.save();
    ctx.strokeStyle = "#0aa5ff";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(s.x - 3, s.y - 3, s.w + 6, s.h + 6);
    ctx.setLineDash([]);
    const hs = cell * 1.5;
    ctx.fillStyle = "#0aa5ff";
    ctx.fillRect(s.x + s.w - hs / 2, s.y + s.h - hs / 2, hs, hs);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x + s.w - hs / 2 + 4, s.y + s.h - hs / 2 + 4, hs - 8, hs - 8);
    ctx.restore();
}

/** Handle bounds (canvas coords) for the bottom-right resize grip. */
export function handleRect(s: Shape, cell = CELL) {
    const hs = cell * 1.5;
    return { x: s.x + s.w - hs / 2, y: s.y + s.h - hs / 2, size: hs };
}

export { CANVAS_W, CANVAS_H, CELL };
