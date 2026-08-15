import { describe, it, expect } from "vitest";
import {
    type Shape,
    rotatedShape,
    shapeCorners,
    rotateHandlePoint,
    resizeHandlePoint,
    resizedFromCorner,
    movedShape,
    resizedShape,
    hitTest,
    occupiedCells,
    floodFill,
    newFreeShape,
    addFreeCell,
    newShape,
    defaultBox,
    pointInShape,
    CELL,
    CANVAS_W,
    CANVAS_H,
} from "@/lib/shapes";

const box = (over: Partial<Shape> = {}): Shape => ({ id: "s", type: "rectangle", x: 200, y: 200, w: 200, h: 100, color: "#e11d2a", ...over });

describe("rotation", () => {
    it("snaps rotation to the nearest 15deg and wraps into 0..359", () => {
        expect(rotatedShape(box(), 7).angle).toBe(0);
        expect(rotatedShape(box(), 8).angle).toBe(15);
        expect(rotatedShape(box(), -15).angle).toBe(345);
        expect(rotatedShape(box(), 375).angle).toBe(15);
    });

    it("shapeCorners returns the bbox corners at angle 0", () => {
        const [tl, tr, br, bl] = shapeCorners(box({ angle: 0 }));
        expect(tl).toEqual([200, 200]);
        expect(tr).toEqual([400, 200]);
        expect(br).toEqual([400, 300]);
        expect(bl).toEqual([200, 300]);
    });

    it("shapeCorners rotates around the center", () => {
        const [tl] = shapeCorners(box({ angle: 90 }));
        // 90deg about center (300,250): TL(200,200) -> (350,150)
        expect(tl[0]).toBeCloseTo(350, 5);
        expect(tl[1]).toBeCloseTo(150, 5);
    });

    it("rotate + resize handle points sit off the corner/top at angle 0", () => {
        const rot = rotateHandlePoint(box({ angle: 0 }));
        expect(rot[0]).toBeCloseTo(300, 5); // centered on x
        expect(rot[1]).toBeCloseTo(200 - CELL * 2, 5); // above the top edge
        const rz = resizeHandlePoint(box({ angle: 0 }));
        expect(rz).toEqual([400, 300]); // bottom-right corner
    });
});

describe("resize", () => {
    it("resizedFromCorner keeps the anchor fixed and snaps the size", () => {
        const s = box({ angle: 0 });
        const anchor: [number, number] = [200, 200]; // keep TL fixed
        const out = resizedFromCorner(s, anchor, 520, 360);
        expect(out.x).toBeCloseTo(200, 5);
        expect(out.y).toBeCloseTo(200, 5);
        expect(out.w).toBe(320);
        expect(out.h).toBe(160);
    });

    it("resizedFromCorner clamps to a 2-cell minimum", () => {
        const out = resizedFromCorner(box({ angle: 0 }), [200, 200], 205, 205);
        expect(out.w).toBe(CELL * 2);
        expect(out.h).toBe(CELL * 2);
    });

    it("resizedShape clamps to a min size and keeps the shape on-canvas", () => {
        const b = box(); // x=200, y=200
        expect(resizedShape(b, 5, 5).w).toBe(CELL * 2);
        expect(resizedShape(b, 999999, 999999).w).toBe(CANVAS_W - b.x);
        expect(resizedShape(b, 999999, 999999).h).toBe(CANVAS_H - b.y);
    });

    it("movedShape clamps inside the canvas", () => {
        expect(movedShape(box(), -9999, -9999)).toMatchObject({ x: 0, y: 0 });
        const far = movedShape(box(), 9999, 9999);
        expect(far.x).toBe(CANVAS_W - 200);
        expect(far.y).toBe(CANVAS_H - 100);
    });
});

describe("free cells + fill + hit-test", () => {
    it("newFreeShape starts empty and addFreeCell dedupes", () => {
        let f = newFreeShape("f", "#000000");
        expect(f.cells).toEqual([]);
        f = addFreeCell(f, 3, 4);
        f = addFreeCell(f, 3, 4); // duplicate ignored
        f = addFreeCell(f, 5, 6);
        expect(f.cells).toEqual([
            [3, 4],
            [5, 6],
        ]);
    });

    it("occupiedCells reports a placed shape's cells; floodFill only fills enclosed areas", () => {
        const s = newShape("a", "square", CANVAS_W / 2, CANVAS_H / 2, "#2ecc40");
        const occ = occupiedCells([s]);
        expect(occ.size).toBeGreaterThan(0);
        expect(floodFill(occ, 0, 0)).toEqual([]); // open to the paper edge -> not enclosed
        // a single cell fully walled in DOES fill
        const wall = new Set(["4,5", "6,5", "5,4", "5,6"]);
        expect(floodFill(wall, 5, 5)).toEqual([[5, 5]]);
    });

    it("hitTest returns the topmost shape under a point, else null", () => {
        const a = newShape("a", "square", 300, 300, "#000000");
        const b = newShape("b", "square", 300, 300, "#ffffff");
        const hit = hitTest([a, b], a.x + a.w / 2, a.y + a.h / 2);
        expect(hit?.id).toBe("b"); // later shape wins
        expect(hitTest([a, b], 5, 5)).toBeNull();
    });

    it("defaultBox gives lines a wide, short box", () => {
        const line = defaultBox("line-solid");
        const sq = defaultBox("square");
        expect(line.w).toBeGreaterThan(line.h);
        expect(sq.w).toBe(sq.h);
    });
});

describe("trapezoid hit region", () => {
    it("includes a point on the flat base", () => {
        const t = box({ type: "trapezoid", x: 100, y: 100, w: 200, h: 200 });
        // a point low and centered lands on the base band
        expect(pointInShape(t, 200, 260)).toBe(true);
    });
});
