// Pure, framework-free shape geometry + Minecraft-style pixelation.
// Everything here is deterministic and unit-tested; the canvas just draws the cells.

export type ShapeType =
    | "square"
    | "rectangle"
    | "circle"
    | "parallelogram"
    | "triangle"
    | "pentagon"
    | "hexagon"
    | "octagon"
    | "moon"
    | "star"
    | "line-solid"
    | "line-dash"
    | "line-dot";

export interface Shape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
}

export type Cell = [number, number]; // grid coords (in CELL units)
export type Pt = [number, number];

/** Size of one Minecraft "block" in canvas pixels. */
export const CELL = 16;

/** Logical canvas size (the white sheet). Fixed so exports are consistent. */
export const CANVAS_W = 1280;
export const CANVAS_H = 896;

/** Kid-friendly paint palette. */
export const PALETTE = ["#000000", "#ffffff", "#e11d2a", "#ff7a00", "#ffd400", "#2ecc40", "#0aa5ff", "#0047ab", "#8e44ec", "#ff5fa2", "#8b5a2b", "#9aa5b1"];

interface LibEntry {
    type: ShapeType;
    name: string;
    keywords: string[];
}

export const SHAPE_LIBRARY: LibEntry[] = [
    { type: "square", name: "Square", keywords: ["box", "block", "4"] },
    { type: "rectangle", name: "Rectangle", keywords: ["box", "bar", "wide"] },
    { type: "circle", name: "Circle", keywords: ["round", "ball", "dot", "sun"] },
    { type: "triangle", name: "Triangle", keywords: ["3", "roof", "arrow"] },
    { type: "parallelogram", name: "Parallelogram", keywords: ["slant", "skew", "rhombus"] },
    { type: "pentagon", name: "Pentagon", keywords: ["5", "polygon"] },
    { type: "hexagon", name: "Hexagon", keywords: ["6", "polygon", "honeycomb"] },
    { type: "octagon", name: "Octagon", keywords: ["8", "polygon", "stop"] },
    { type: "star", name: "Star", keywords: ["night", "sky", "sparkle"] },
    { type: "moon", name: "Moon", keywords: ["crescent", "night", "sky"] },
    { type: "line-solid", name: "Solid Line", keywords: ["line", "stroke", "bar"] },
    { type: "line-dash", name: "Dashed Line", keywords: ["line", "dash", "dashed"] },
    { type: "line-dot", name: "Dotted Line", keywords: ["line", "dot", "dotted"] },
];

/** Filter the library by a search query over name + keywords. */
export function searchShapes(query: string): LibEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return SHAPE_LIBRARY;
    return SHAPE_LIBRARY.filter((s) => s.name.toLowerCase().includes(q) || s.type.includes(q) || s.keywords.some((k) => k.includes(q)));
}

/** Snap a value to the nearest block. */
export const snap = (v: number, cell = CELL): number => Math.round(v / cell) * cell;

/** Clamp helper. */
export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

const POLY_SIDES: Partial<Record<ShapeType, number>> = { pentagon: 5, hexagon: 6, octagon: 8 };

/** Regular n-gon vertices inscribed in the bbox, flat-ish top. */
function regularPolygon(x: number, y: number, w: number, h: number, sides: number): Pt[] {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const start = -Math.PI / 2; // point up
    const pts: Pt[] = [];
    for (let i = 0; i < sides; i++) {
        const a = start + (i / sides) * Math.PI * 2;
        pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
}

/** 5-point star vertices (outer/inner alternating). */
function starPolygon(x: number, y: number, w: number, h: number): Pt[] {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const pts: Pt[] = [];
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
        const outer = i % 2 === 0;
        const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
        const r = outer ? 1 : 0.42;
        pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
    }
    return pts;
}

/** Polygon vertices for polygonal shape types; null for circle/moon/lines. */
export function shapeVerts(s: Shape): Pt[] | null {
    switch (s.type) {
        case "square":
        case "rectangle":
            return [
                [s.x, s.y],
                [s.x + s.w, s.y],
                [s.x + s.w, s.y + s.h],
                [s.x, s.y + s.h],
            ];
        case "parallelogram": {
            const off = s.w * 0.28;
            return [
                [s.x + off, s.y],
                [s.x + s.w, s.y],
                [s.x + s.w - off, s.y + s.h],
                [s.x, s.y + s.h],
            ];
        }
        case "triangle":
            return [
                [s.x + s.w / 2, s.y],
                [s.x + s.w, s.y + s.h],
                [s.x, s.y + s.h],
            ];
        case "pentagon":
        case "hexagon":
        case "octagon":
            return regularPolygon(s.x, s.y, s.w, s.h, POLY_SIDES[s.type]!);
        case "star":
            return starPolygon(s.x, s.y, s.w, s.h);
        default:
            return null;
    }
}

/** Ray-cast point-in-polygon. */
export function pointInPolygon(px: number, py: number, verts: Pt[]): boolean {
    let inside = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const [xi, yi] = verts[i];
        const [xj, yj] = verts[j];
        const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function inEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): boolean {
    if (rx <= 0 || ry <= 0) return false;
    const dx = (px - cx) / rx;
    const dy = (py - cy) / ry;
    return dx * dx + dy * dy <= 1;
}

/** Is the point inside the shape's true (pre-pixelation) area? */
export function pointInShape(s: Shape, px: number, py: number): boolean {
    const verts = shapeVerts(s);
    if (verts) return pointInPolygon(px, py, verts);
    if (s.type === "circle") return inEllipse(px, py, s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2);
    if (s.type === "moon") {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const outer = inEllipse(px, py, cx, cy, s.w / 2, s.h / 2);
        // carve a second disc offset to the right to make a crescent
        const inner = inEllipse(px, py, cx + s.w * 0.32, cy, s.w * 0.42, s.h * 0.46);
        return outer && !inner;
    }
    return false; // lines handled separately
}

function lineCells(s: Shape, cell: number): Cell[] {
    // A line runs corner-to-corner across its bbox, one block thick.
    const x0 = s.x + cell / 2;
    const y0 = s.y + cell / 2;
    const x1 = s.x + s.w - cell / 2;
    const y1 = s.y + s.h - cell / 2;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(dist / cell));
    const cells: Cell[] = [];
    const seen = new Set<string>();
    for (let i = 0; i <= steps; i++) {
        // dash: draw 2, skip 1; dot: draw 1, skip 1
        if (s.type === "line-dash" && i % 3 === 2) continue;
        if (s.type === "line-dot" && i % 2 === 1) continue;
        const t = steps === 0 ? 0 : i / steps;
        const cx = Math.floor((x0 + (x1 - x0) * t) / cell);
        const cy = Math.floor((y0 + (y1 - y0) * t) / cell);
        const key = `${cx},${cy}`;
        if (!seen.has(key)) {
            seen.add(key);
            cells.push([cx, cy]);
        }
    }
    return cells;
}

/** Rasterize a shape to Minecraft blocks: the grid cells it covers. Pure. */
export function shapeCells(s: Shape, cell = CELL): Cell[] {
    if (s.type === "line-solid" || s.type === "line-dash" || s.type === "line-dot") return lineCells(s, cell);
    const c0x = Math.floor(s.x / cell);
    const c0y = Math.floor(s.y / cell);
    const c1x = Math.ceil((s.x + s.w) / cell);
    const c1y = Math.ceil((s.y + s.h) / cell);
    const cells: Cell[] = [];
    for (let cy = c0y; cy < c1y; cy++) {
        for (let cx = c0x; cx < c1x; cx++) {
            const midX = cx * cell + cell / 2;
            const midY = cy * cell + cell / 2;
            if (pointInShape(s, midX, midY)) cells.push([cx, cy]);
        }
    }
    return cells;
}

/** Does the shape's pixel area contain this canvas point? (selection/paint hit test) */
export function shapeContains(s: Shape, px: number, py: number, cell = CELL): boolean {
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    return shapeCells(s, cell).some(([x, y]) => x === cx && y === cy);
}

/** Topmost shape under a point (last drawn wins), or null. */
export function hitTest(shapes: Shape[], px: number, py: number, cell = CELL): Shape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapeContains(shapes[i], px, py, cell)) return shapes[i];
    }
    return null;
}

/** Default bounding box for a freshly added shape, centered near a point, snapped. */
export function defaultBox(type: ShapeType): { w: number; h: number } {
    if (type === "rectangle") return { w: CELL * 12, h: CELL * 7 };
    if (type === "line-solid" || type === "line-dash" || type === "line-dot") return { w: CELL * 12, h: CELL * 4 };
    return { w: CELL * 8, h: CELL * 8 };
}

/** Build a new shape centered at (cx, cy), snapped to the grid and kept on-canvas. */
export function newShape(id: string, type: ShapeType, cx: number, cy: number, color: string): Shape {
    const { w, h } = defaultBox(type);
    const x = clamp(snap(cx - w / 2), 0, CANVAS_W - w);
    const y = clamp(snap(cy - h / 2), 0, CANVAS_H - h);
    return { id, type, x, y, w, h, color };
}

/** Move a shape by a delta, snapped and clamped to the canvas. */
export function movedShape(s: Shape, dx: number, dy: number): Shape {
    return { ...s, x: clamp(snap(s.x + dx), 0, CANVAS_W - s.w), y: clamp(snap(s.y + dy), 0, CANVAS_H - s.h) };
}

/** Resize from the bottom-right handle, snapped, with a minimum size, kept on-canvas. */
export function resizedShape(s: Shape, w: number, h: number): Shape {
    const nw = clamp(snap(w), CELL * 2, CANVAS_W - s.x);
    const nh = clamp(snap(h), CELL * 2, CANVAS_H - s.y);
    return { ...s, w: nw, h: nh };
}

/** Safe filename for the exported PNG. */
export function exportFilename(name: string): string {
    const base = (name || "pixy-drawing")
        .toLowerCase()
        .replace(/[^a-z0-9-]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return `${base || "pixy-drawing"}.png`;
}

/** Human date label, e.g. "Jul 20, 2026". Pass a Date for testability. */
export function dateLabel(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
