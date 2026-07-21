import { type Shape, shapeCells, shapeCorners, rotateHandlePoint, resizeHandlePoint, CELL, CANVAS_W, CANVAS_H } from "@/lib/shapes";

export type Nameplate = { student: string; date: string };

/** Kid-handwriting font stack. Uses Apple's built-in handwriting faces (iPad/Mac) so no web font is needed. */
export const HAND_FONT = "'Bradley Hand', 'Noteworthy', 'Chalkboard SE', 'Comic Sans MS', cursive";

/** Per-block grid line color that stays visible on both dark and light fills. */
function gridStroke(color: string): string {
    let hex = color.replace("#", "");
    if (hex.length === 3)
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return "rgba(0,0,0,0.07)";
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b; // 0..255
    return lum < 96 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.07)";
}

/** Paint the whole scene: white sheet + optional name header + pixel-block shapes. */
export function paintScene(ctx: CanvasRenderingContext2D, shapes: Shape[], nameplate?: Nameplate, cell = CELL) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (nameplate && (nameplate.student.trim() || nameplate.date)) {
        ctx.save();
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#1d2530";
        ctx.font = `700 34px ${HAND_FONT}`;
        ctx.textAlign = "left";
        if (nameplate.student.trim()) ctx.fillText(nameplate.student, 40, 60);
        ctx.fillStyle = "#6b7280";
        ctx.font = "600 22px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
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
        ctx.strokeStyle = gridStroke(s.color);
        ctx.lineWidth = 1;
        for (const [cx, cy] of shapeCells(s, cell)) {
            const x = cx * cell;
            const y = cy * cell;
            ctx.fillRect(x, y, cell, cell);
            ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1); // subtle per-block grid
        }
    }
}

/** Draw the selection outline + resize and rotate handles, rotated to follow the shape (editor only). */
export function paintSelection(ctx: CanvasRenderingContext2D, s: Shape, cell = CELL) {
    const [tl, tr, br, bl] = shapeCorners(s);
    const topMid: [number, number] = [(tl[0] + tr[0]) / 2, (tl[1] + tr[1]) / 2];
    const rot = rotateHandlePoint(s, cell);
    const rez = resizeHandlePoint(s);
    ctx.save();
    ctx.strokeStyle = "#0aa5ff";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    // rotate grip: stem from the top-edge midpoint to a knob
    ctx.beginPath();
    ctx.moveTo(topMid[0], topMid[1]);
    ctx.lineTo(rot[0], rot[1]);
    ctx.stroke();
    ctx.fillStyle = "#0aa5ff";
    ctx.beginPath();
    ctx.arc(rot[0], rot[1], cell * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(rot[0], rot[1], cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    // resize grip at the (rotated) bottom-right corner
    const hs = cell * 1.5;
    ctx.fillStyle = "#0aa5ff";
    ctx.fillRect(rez[0] - hs / 2, rez[1] - hs / 2, hs, hs);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(rez[0] - hs / 2 + 4, rez[1] - hs / 2 + 4, hs - 8, hs - 8);
    ctx.restore();
}

export { CANVAS_W, CANVAS_H, CELL };
