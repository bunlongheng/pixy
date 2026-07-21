// Pure, framework-free shape geometry + Minecraft-style pixelation.
// Everything here is deterministic and unit-tested; the canvas just draws the cells.

export type ShapeType =
    | "square"
    | "rectangle"
    | "circle"
    | "parallelogram"
    | "triangle"
    | "trapezoid"
    | "hexagon"
    | "octagon"
    | "moon"
    | "star"
    | "asterisk"
    | "heart"
    | "diamond"
    | "cone"
    | "doughnut"
    | "leaf"
    | "tree"
    | "cloud"
    | "spider"
    | "line-solid"
    | "line-dash"
    | "line-dot"
    | "free";

export interface Shape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    angle?: number; // rotation in degrees, clockwise; default 0
    cells?: Cell[]; // painted grid cells for freehand ("free") strokes
}

export type Cell = [number, number]; // grid coords (in CELL units)
export type Pt = [number, number];

/** Size of one Minecraft "block" in canvas pixels. Tuned so shapes read as pixel art but not crude. */
export const CELL = 20;

/** Logical canvas size (the white sheet). Fixed so exports are consistent. */
export const CANVAS_W = 1280;
export const CANVAS_H = 896;

/** Grid dimensions in whole blocks. */
export const GRID_W = Math.ceil(CANVAS_W / CELL);
export const GRID_H = Math.ceil(CANVAS_H / CELL);

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
    { type: "trapezoid", name: "Trapezoid", keywords: ["4", "polygon", "trapezium", "bucket"] },
    { type: "hexagon", name: "Hexagon", keywords: ["6", "polygon", "honeycomb"] },
    { type: "octagon", name: "Octagon", keywords: ["8", "polygon", "stop"] },
    { type: "star", name: "Star", keywords: ["night", "sky", "sparkle"] },
    { type: "asterisk", name: "Asterisk", keywords: ["star", "sparkle", "snowflake", "spokes", "*"] },
    { type: "moon", name: "Moon", keywords: ["crescent", "night", "sky"] },
    { type: "heart", name: "Heart", keywords: ["love", "valentine"] },
    { type: "diamond", name: "Diamond", keywords: ["rhombus", "gem", "kite"] },
    { type: "cone", name: "Cone", keywords: ["ice cream", "traffic", "hat"] },
    { type: "doughnut", name: "Doughnut", keywords: ["donut", "ring", "torus"] },
    { type: "leaf", name: "Leaf", keywords: ["plant", "nature"] },
    { type: "tree", name: "Tree", keywords: ["plant", "nature", "pine"] },
    { type: "cloud", name: "Cloud", keywords: ["sky", "weather"] },
    { type: "spider", name: "Spider", keywords: ["bug", "insect", "web"] },
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

/** Rotate point (px,py) around center (cx,cy) by `rad` radians. */
function rotatePt(px: number, py: number, cx: number, cy: number, rad: number): Pt {
    const c = Math.cos(rad);
    const sn = Math.sin(rad);
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * c - dy * sn, cy + dx * sn + dy * c];
}

const POLY_SIDES: Partial<Record<ShapeType, number>> = { hexagon: 6, octagon: 8 };

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
        case "trapezoid": {
            const off = s.w * 0.22;
            return [
                [s.x + off, s.y],
                [s.x + s.w - off, s.y],
                [s.x + s.w, s.y + s.h],
                [s.x, s.y + s.h],
            ];
        }
        case "hexagon":
        case "octagon":
            return regularPolygon(s.x, s.y, s.w, s.h, POLY_SIDES[s.type]!);
        case "diamond":
            return [
                [s.x + s.w / 2, s.y],
                [s.x + s.w, s.y + s.h / 2],
                [s.x + s.w / 2, s.y + s.h],
                [s.x, s.y + s.h / 2],
            ];
        case "cone":
            return [
                [s.x + s.w * 0.42, s.y],
                [s.x + s.w * 0.58, s.y],
                [s.x + s.w, s.y + s.h],
                [s.x, s.y + s.h],
            ];
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
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    if (s.type === "moon") {
        const outer = inEllipse(px, py, cx, cy, s.w / 2, s.h / 2);
        // carve a second disc offset to the right to make a crescent
        const inner = inEllipse(px, py, cx + s.w * 0.32, cy, s.w * 0.42, s.h * 0.46);
        return outer && !inner;
    }
    if (s.type === "doughnut") {
        return inEllipse(px, py, cx, cy, s.w / 2, s.h / 2) && !inEllipse(px, py, cx, cy, s.w * 0.22, s.h * 0.22);
    }
    if (s.type === "heart") {
        const lobeR = s.w * 0.26;
        const ly = cy - s.h * 0.14;
        if (inEllipse(px, py, cx - s.w * 0.23, ly, lobeR, lobeR)) return true;
        if (inEllipse(px, py, cx + s.w * 0.23, ly, lobeR, lobeR)) return true;
        return pointInPolygon(px, py, [
            [cx - s.w * 0.49, ly],
            [cx + s.w * 0.49, ly],
            [cx, s.y + s.h * 0.95],
        ]);
    }
    if (s.type === "leaf") {
        // vertical lens: two circles offset left/right, intersection is a pointed upright leaf
        return inEllipse(px, py, cx - s.w * 0.55, cy, s.w * 0.68, s.h * 0.68) && inEllipse(px, py, cx + s.w * 0.55, cy, s.w * 0.68, s.h * 0.68);
    }
    if (s.type === "tree") {
        const foliage: Pt[] = [
            [cx, s.y],
            [s.x + s.w * 0.92, s.y + s.h * 0.72],
            [s.x + s.w * 0.08, s.y + s.h * 0.72],
        ];
        if (pointInPolygon(px, py, foliage)) return true;
        return px >= cx - s.w * 0.1 && px <= cx + s.w * 0.1 && py >= s.y + s.h * 0.68 && py <= s.y + s.h; // trunk
    }
    if (s.type === "cloud") {
        const bumps: [number, number, number][] = [
            [cx - s.w * 0.26, cy + s.h * 0.02, s.w * 0.2],
            [cx, cy - s.h * 0.16, s.w * 0.27],
            [cx + s.w * 0.26, cy + s.h * 0.02, s.w * 0.2],
        ];
        for (const [bx, by, r] of bumps) if (inEllipse(px, py, bx, by, r, r)) return true;
        return px >= s.x + s.w * 0.08 && px <= s.x + s.w * 0.92 && py >= cy && py <= cy + s.h * 0.32; // flat base
    }
    return false; // lines / spider handled separately
}

function lineCells(s: Shape, cell: number): Cell[] {
    // A straight line through the centre of its bbox, one block thick, at `angle`.
    const rad = ((s.angle ?? 0) * Math.PI) / 180;
    const ccx = s.x + s.w / 2;
    const ccy = s.y + s.h / 2;
    const half = s.w / 2;
    const ax = ccx - half * Math.cos(rad);
    const ay = ccy - half * Math.sin(rad);
    const bx = ccx + half * Math.cos(rad);
    const by = ccy + half * Math.sin(rad);
    const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / cell));
    const cells: Cell[] = [];
    const seen = new Set<string>();
    for (let i = 0; i <= steps; i++) {
        // dash: draw 2, skip 1; dot: draw 1, skip 1
        if (s.type === "line-dash" && i % 3 === 2) continue;
        if (s.type === "line-dot" && i % 2 === 1) continue;
        const t = i / steps;
        const gx = Math.floor((ax + (bx - ax) * t) / cell);
        const gy = Math.floor((ay + (by - ay) * t) / cell);
        const key = `${gx},${gy}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cells.push([gx, gy]);
    }
    return cells;
}

function asteriskCells(s: Shape, cell: number): Cell[] {
    // Six spokes 60 deg apart with a vertical arm - reads as a proper asterisk.
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const rx = s.w / 2 - cell / 2;
    const ry = s.h / 2 - cell / 2;
    const base = ((s.angle ?? 0) * Math.PI) / 180;
    const cells: Cell[] = [];
    const seen = new Set<string>();
    const push = (px: number, py: number) => {
        const gx = Math.floor(px / cell);
        const gy = Math.floor(py / cell);
        const key = `${gx},${gy}`;
        if (!seen.has(key)) {
            seen.add(key);
            cells.push([gx, gy]);
        }
    };
    for (const deg of [30, 90, 150, 210, 270, 330]) {
        const rad = base + (deg * Math.PI) / 180;
        const ex = cx + rx * Math.cos(rad);
        const ey = cy + ry * Math.sin(rad);
        const steps = Math.max(1, Math.round(Math.hypot(ex - cx, ey - cy) / cell));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            push(cx + (ex - cx) * t, cy + (ey - cy) * t);
        }
    }
    return cells;
}

function spiderCells(s: Shape, cell: number): Cell[] {
    // A round two-part body with eight legs radiating out - reads as a spider.
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const base = ((s.angle ?? 0) * Math.PI) / 180;
    const cells: Cell[] = [];
    const seen = new Set<string>();
    const push = (px: number, py: number) => {
        const gx = Math.floor(px / cell);
        const gy = Math.floor(py / cell);
        const key = `${gx},${gy}`;
        if (!seen.has(key)) {
            seen.add(key);
            cells.push([gx, gy]);
        }
    };
    // body: head + abdomen ellipses
    const bodies: [number, number, number, number][] = [
        [cx, cy - s.h * 0.1, s.w * 0.12, s.h * 0.12],
        [cx, cy + s.h * 0.12, s.w * 0.18, s.h * 0.2],
    ];
    for (let gy = Math.floor(s.y / cell); gy < Math.ceil((s.y + s.h) / cell); gy++) {
        for (let gx = Math.floor(s.x / cell); gx < Math.ceil((s.x + s.w) / cell); gx++) {
            const mx = gx * cell + cell / 2;
            const my = gy * cell + cell / 2;
            for (const [bx, by, brx, bry] of bodies) if (inEllipse(mx, my, bx, by, brx, bry)) push(mx, my);
        }
    }
    // eight legs, four per side
    const legLen = Math.min(s.w, s.h) * 0.6;
    for (const deg of [150, 170, 190, 210, 30, 10, 350, 330]) {
        const rad = base + (deg * Math.PI) / 180;
        const ex = cx + legLen * Math.cos(rad);
        const ey = cy + legLen * Math.sin(rad);
        const steps = Math.max(1, Math.round(Math.hypot(ex - cx, ey - cy) / cell));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            push(cx + (ex - cx) * t, cy + (ey - cy) * t);
        }
    }
    return cells;
}

/** Rasterize a shape to Minecraft blocks: the grid cells it covers. Pure. */
export function shapeCells(s: Shape, cell = CELL): Cell[] {
    if (s.type === "free") return s.cells ?? [];
    if (s.type === "line-solid" || s.type === "line-dash" || s.type === "line-dot") return lineCells(s, cell);
    if (s.type === "asterisk") return asteriskCells(s, cell);
    if (s.type === "spider") return spiderCells(s, cell);
    const ang = ((s.angle ?? 0) * Math.PI) / 180;
    const ccx = s.x + s.w / 2;
    const ccy = s.y + s.h / 2;
    // When rotated, sample the circle that circumscribes the box so nothing clips.
    const R = ang ? Math.hypot(s.w, s.h) / 2 : 0;
    const c0x = Math.floor((ang ? ccx - R : s.x) / cell);
    const c0y = Math.floor((ang ? ccy - R : s.y) / cell);
    const c1x = Math.ceil((ang ? ccx + R : s.x + s.w) / cell);
    const c1y = Math.ceil((ang ? ccy + R : s.y + s.h) / cell);
    const cells: Cell[] = [];
    for (let cy = c0y; cy < c1y; cy++) {
        for (let cx = c0x; cx < c1x; cx++) {
            let midX = cx * cell + cell / 2;
            let midY = cy * cell + cell / 2;
            if (ang) [midX, midY] = rotatePt(midX, midY, ccx, ccy, -ang);
            if (pointInShape(s, midX, midY)) cells.push([cx, cy]);
        }
    }
    return cells;
}

/** Set of "cx,cy" keys for every painted cell in the scene (for flood fill / occupancy). */
export function occupiedCells(shapes: Shape[], cell = CELL): Set<string> {
    const occ = new Set<string>();
    for (const s of shapes) for (const [x, y] of shapeCells(s, cell)) occ.add(`${x},${y}`);
    return occ;
}

/**
 * Flood-fill the connected empty region from (cx,cy), bounded by occupied cells.
 * Returns [] if the region is NOT enclosed (it reaches the paper edge) so the bucket
 * never floods the whole sheet - you can only fill a closed area.
 */
export function floodFill(occupied: Set<string>, cx: number, cy: number): Cell[] {
    const key = (x: number, y: number) => `${x},${y}`;
    if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H || occupied.has(key(cx, cy))) return [];
    const filled: Cell[] = [];
    const seen = new Set<string>([key(cx, cy)]);
    const stack: Cell[] = [[cx, cy]];
    let reachedEdge = false;
    while (stack.length) {
        const [x, y] = stack.pop()!;
        if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1) reachedEdge = true;
        filled.push([x, y]);
        const nbrs: Cell[] = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
        ];
        for (const [nx, ny] of nbrs) {
            if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
            const k = key(nx, ny);
            if (seen.has(k) || occupied.has(k)) continue;
            seen.add(k);
            stack.push([nx, ny]);
        }
    }
    return reachedEdge ? [] : filled; // open to the paper edge = not enclosed, don't fill
}

/** Does the shape's pixel area contain this canvas point? (selection/paint hit test) */
export function shapeContains(s: Shape, px: number, py: number, cell = CELL): boolean {
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    return shapeCells(s, cell).some(([x, y]) => x === cx && y === cy);
}

/** Topmost shape under a point (last drawn wins), or null. Freehand strokes are background paint, not selectable. */
export function hitTest(shapes: Shape[], px: number, py: number, cell = CELL): Shape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapes[i].type === "free") continue;
        if (shapeContains(shapes[i], px, py, cell)) return shapes[i];
    }
    return null;
}

/** Default bounding box for a freshly added shape, centered near a point, snapped. */
export function defaultBox(type: ShapeType): { w: number; h: number } {
    if (type === "rectangle") return { w: CELL * 13, h: CELL * 8 };
    if (type === "line-solid" || type === "line-dash" || type === "line-dot") return { w: CELL * 13, h: CELL * 4 };
    if (type === "asterisk" || type === "star") return { w: CELL * 11, h: CELL * 11 };
    if (type === "tree") return { w: CELL * 11, h: CELL * 14 };
    if (type === "leaf") return { w: CELL * 10, h: CELL * 14 };
    if (type === "cloud") return { w: CELL * 14, h: CELL * 9 };
    if (type === "heart" || type === "spider" || type === "doughnut") return { w: CELL * 13, h: CELL * 13 };
    return { w: CELL * 9, h: CELL * 9 };
}

/** A fresh empty freehand stroke in the given color. */
export function newFreeShape(id: string, color: string): Shape {
    return { id, type: "free", x: 0, y: 0, w: 0, h: 0, color, cells: [] };
}

/** Append a grid cell to a freehand stroke (deduped). Pure. */
export function addFreeCell(s: Shape, cx: number, cy: number): Shape {
    const cells = s.cells ?? [];
    if (cells.some(([x, y]) => x === cx && y === cy)) return s;
    return { ...s, cells: [...cells, [cx, cy]] };
}

/** Set a shape's rotation, snapped to 15-degree steps and normalized to [0,360). */
export function rotatedShape(s: Shape, deg: number): Shape {
    const snapped = Math.round(deg / 15) * 15;
    return { ...s, angle: ((snapped % 360) + 360) % 360 };
}

/** The four bbox corners [TL, TR, BR, BL], rotated by the shape's angle around its center. */
export function shapeCorners(s: Shape): [Pt, Pt, Pt, Pt] {
    const rad = ((s.angle ?? 0) * Math.PI) / 180;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    return [
        rotatePt(s.x, s.y, cx, cy, rad),
        rotatePt(s.x + s.w, s.y, cx, cy, rad),
        rotatePt(s.x + s.w, s.y + s.h, cx, cy, rad),
        rotatePt(s.x, s.y + s.h, cx, cy, rad),
    ];
}

/** Center of the rotate grip (above the shape's top edge), rotated with the shape. */
export function rotateHandlePoint(s: Shape, cell = CELL): Pt {
    const rad = ((s.angle ?? 0) * Math.PI) / 180;
    return rotatePt(s.x + s.w / 2, s.y - cell * 2, s.x + s.w / 2, s.y + s.h / 2, rad);
}

/** Center of the resize grip (bottom-right corner), rotated with the shape. */
export function resizeHandlePoint(s: Shape): Pt {
    const rad = ((s.angle ?? 0) * Math.PI) / 180;
    return rotatePt(s.x + s.w, s.y + s.h, s.x + s.w / 2, s.y + s.h / 2, rad);
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
