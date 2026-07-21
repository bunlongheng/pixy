import { describe, it, expect } from "vitest";
import {
    SHAPE_LIBRARY,
    searchShapes,
    snap,
    clamp,
    pointInPolygon,
    shapeVerts,
    shapeCells,
    shapeContains,
    hitTest,
    newShape,
    movedShape,
    resizedShape,
    newFreeShape,
    addFreeCell,
    rotatedShape,
    occupiedCells,
    floodFill,
    exportFilename,
    dateLabel,
    defaultBox,
    CELL,
    CANVAS_W,
    CANVAS_H,
    type Shape,
    type ShapeType,
} from "@/lib/shapes";

const mk = (type: ShapeType, over: Partial<Shape> = {}): Shape => ({ id: "t", type, x: 100, y: 100, w: 128, h: 128, color: "#111", ...over });

describe("library + search", () => {
    it("has all requested shapes (trapezoid, not pentagon)", () => {
        const types = SHAPE_LIBRARY.map((s) => s.type);
        for (const t of [
            "square",
            "rectangle",
            "circle",
            "parallelogram",
            "trapezoid",
            "triangle",
            "hexagon",
            "octagon",
            "moon",
            "star",
            "asterisk",
            "line-solid",
            "line-dash",
            "line-dot",
        ]) {
            expect(types).toContain(t as ShapeType);
        }
        expect(types).not.toContain("pentagon" as ShapeType);
    });
    it("searches by name, type, and keyword", () => {
        expect(searchShapes("star").map((s) => s.type)).toContain("star");
        expect(searchShapes("round").map((s) => s.type)).toContain("circle");
        expect(searchShapes("dash").map((s) => s.type)).toEqual(["line-dash"]);
        expect(searchShapes("")).toHaveLength(SHAPE_LIBRARY.length);
        expect(searchShapes("zzzz")).toHaveLength(0);
    });
});

describe("grid helpers", () => {
    it("snap rounds to the block size", () => {
        expect(snap(0)).toBe(0);
        expect(snap(CELL)).toBe(CELL);
        expect(snap(CELL * 0.6)).toBe(CELL);
        expect(snap(CELL * 0.4)).toBe(0);
    });
    it("clamp bounds", () => {
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(20, 0, 10)).toBe(10);
    });
});

describe("geometry", () => {
    it("pointInPolygon: square membership", () => {
        const sq: [number, number][] = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
        ];
        expect(pointInPolygon(5, 5, sq)).toBe(true);
        expect(pointInPolygon(15, 5, sq)).toBe(false);
    });
    it("shapeVerts: polygons have the right vertex count, curves are null", () => {
        expect(shapeVerts(mk("triangle"))).toHaveLength(3);
        expect(shapeVerts(mk("trapezoid"))).toHaveLength(4);
        expect(shapeVerts(mk("hexagon"))).toHaveLength(6);
        expect(shapeVerts(mk("octagon"))).toHaveLength(8);
        expect(shapeVerts(mk("star"))).toHaveLength(10);
        expect(shapeVerts(mk("circle"))).toBeNull();
        expect(shapeVerts(mk("moon"))).toBeNull();
        expect(shapeVerts(mk("line-solid"))).toBeNull();
    });
});

describe("pixelation (shapeCells)", () => {
    it("a square fills its whole block grid", () => {
        const s = mk("square", { x: 0, y: 0, w: CELL * 4, h: CELL * 4 }); // 4x4 blocks
        expect(shapeCells(s)).toHaveLength(16);
    });
    it("every shape type produces at least some cells", () => {
        for (const entry of SHAPE_LIBRARY) {
            expect(shapeCells(mk(entry.type)).length, entry.type).toBeGreaterThan(0);
        }
    });
    it("a circle covers fewer cells than its bounding square but more than half", () => {
        const box = mk("square", { x: 0, y: 0, w: 160, h: 160 });
        const circle = mk("circle", { x: 0, y: 0, w: 160, h: 160 });
        const sq = shapeCells(box).length;
        const ci = shapeCells(circle).length;
        expect(ci).toBeLessThan(sq);
        expect(ci).toBeGreaterThan(sq * 0.5);
    });
    it("a moon (crescent) covers fewer cells than a full circle of the same box", () => {
        const circle = shapeCells(mk("circle", { x: 0, y: 0, w: 160, h: 160 })).length;
        const moon = shapeCells(mk("moon", { x: 0, y: 0, w: 160, h: 160 })).length;
        expect(moon).toBeLessThan(circle);
        expect(moon).toBeGreaterThan(0);
    });
    it("dashed and dotted lines use fewer blocks than a solid line", () => {
        const solid = shapeCells(mk("line-solid", { w: 200, h: 200 })).length;
        const dash = shapeCells(mk("line-dash", { w: 200, h: 200 })).length;
        const dot = shapeCells(mk("line-dot", { w: 200, h: 200 })).length;
        expect(dash).toBeLessThan(solid);
        expect(dot).toBeLessThan(solid);
    });
});

describe("rotation", () => {
    it("rotatedShape snaps to 15-degree steps and normalizes", () => {
        expect(rotatedShape(mk("square"), 7).angle).toBe(0);
        expect(rotatedShape(mk("square"), 44).angle).toBe(45);
        expect(rotatedShape(mk("square"), -15).angle).toBe(345);
        expect(rotatedShape(mk("square"), 360).angle).toBe(0);
    });
    it("a rotated square keeps roughly the same block count", () => {
        const flat = shapeCells(mk("square", { x: 0, y: 0, w: CELL * 6, h: CELL * 6 })).length;
        const spun = shapeCells(mk("square", { x: 0, y: 0, w: CELL * 6, h: CELL * 6, angle: 45 })).length;
        expect(spun).toBeGreaterThan(flat * 0.6);
    });
    it("a rotated line is no longer purely horizontal", () => {
        const spun = shapeCells(mk("line-solid", { x: 0, y: 0, w: CELL * 10, h: CELL * 10, angle: 90 }));
        const ys = new Set(spun.map(([, y]) => y));
        expect(ys.size).toBeGreaterThan(1); // vertical line spans multiple rows
    });
});

describe("freehand", () => {
    it("newFreeShape starts empty and paints deduped cells", () => {
        let s = newFreeShape("f1", "#f00");
        expect(shapeCells(s)).toHaveLength(0);
        s = addFreeCell(s, 2, 3);
        s = addFreeCell(s, 2, 3); // dupe ignored
        s = addFreeCell(s, 4, 5);
        expect(shapeCells(s)).toHaveLength(2);
    });
    it("freehand strokes are not selectable via hitTest", () => {
        let s = newFreeShape("f1", "#f00");
        s = addFreeCell(s, 1, 1);
        expect(hitTest([s], CELL * 1.5, CELL * 1.5)).toBeNull();
    });
});

describe("paint bucket (flood fill)", () => {
    it("fills the empty interior bounded by an outline", () => {
        // hollow 5x5 box outline; interior 3x3 is empty
        const occ = new Set<string>();
        for (let i = 0; i < 5; i++) {
            occ.add(`${i},0`);
            occ.add(`${i},4`);
            occ.add(`0,${i}`);
            occ.add(`4,${i}`);
        }
        const cells = floodFill(occ, 2, 2);
        expect(cells).toHaveLength(9); // 3x3 interior, does not leak past the outline
    });
    it("returns nothing when the clicked cell is already painted", () => {
        expect(floodFill(new Set<string>(["3,3"]), 3, 3)).toHaveLength(0);
    });
    it("occupiedCells collects every painted cell in the scene", () => {
        const sq = mk("square", { x: 0, y: 0, w: CELL * 2, h: CELL * 2 });
        expect(occupiedCells([sq]).size).toBe(4);
    });
});

describe("hit testing", () => {
    const shapes = [mk("square", { id: "a", x: 0, y: 0, w: 64, h: 64 }), mk("square", { id: "b", x: 32, y: 32, w: 64, h: 64 })];
    it("shapeContains matches the filled area", () => {
        expect(shapeContains(shapes[0], 10, 10)).toBe(true);
        expect(shapeContains(shapes[0], 500, 500)).toBe(false);
    });
    it("hitTest returns the topmost shape", () => {
        expect(hitTest(shapes, 48, 48)?.id).toBe("b"); // overlap -> last wins
        expect(hitTest(shapes, 5, 5)?.id).toBe("a");
        expect(hitTest(shapes, 900, 900)).toBeNull();
    });
});

describe("create / move / resize", () => {
    it("newShape is centered, snapped, and on-canvas", () => {
        const s = newShape("x", "square", CANVAS_W / 2, CANVAS_H / 2, "#f00");
        expect(s.x % CELL).toBe(0);
        expect(s.y % CELL).toBe(0);
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x + s.w).toBeLessThanOrEqual(CANVAS_W);
        expect(defaultBox("rectangle").w).toBeGreaterThan(defaultBox("square").w);
    });
    it("movedShape snaps and clamps into the canvas", () => {
        const s = mk("square", { x: 0, y: 0, w: 64, h: 64 });
        expect(movedShape(s, -50, -50)).toMatchObject({ x: 0, y: 0 });
        const far = movedShape(s, 99999, 99999);
        expect(far.x + far.w).toBeLessThanOrEqual(CANVAS_W);
    });
    it("resizedShape enforces a minimum and snaps", () => {
        const s = mk("square", { x: 0, y: 0, w: 100, h: 100 });
        const tiny = resizedShape(s, 1, 1);
        expect(tiny.w).toBeGreaterThanOrEqual(CELL * 2);
        expect(tiny.w % CELL).toBe(0);
    });
});

describe("export helpers", () => {
    it("exportFilename kebab-cases and always ends in .png", () => {
        expect(exportFilename("Norden's Castle!")).toBe("norden-s-castle.png");
        expect(exportFilename("")).toBe("pixy-drawing.png");
    });
    it("dateLabel formats a given date", () => {
        expect(dateLabel(new Date("2026-07-20T12:00:00"))).toBe("Jul 20, 2026");
    });
});
