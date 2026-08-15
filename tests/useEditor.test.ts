// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEditor } from "@/lib/useEditor";
import { shapeCells, CELL } from "@/lib/shapes";

describe("useEditor", () => {
    it("adds a shape, selects it, and tracks the active color", () => {
        const { result } = renderHook(() => useEditor());
        expect(result.current.shapes).toHaveLength(0);
        expect(result.current.color).toBe("#e11d2a");
        act(() => result.current.setColor("#0aa5ff"));
        act(() => result.current.addShape("square"));
        expect(result.current.shapes).toHaveLength(1);
        expect(result.current.shapes[0].color).toBe("#0aa5ff");
        expect(result.current.selectedId).toBe(result.current.shapes[0].id);
    });

    it("undoes the last change", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("circle"));
        act(() => result.current.addShape("triangle"));
        expect(result.current.shapes).toHaveLength(2);
        act(() => result.current.undo());
        expect(result.current.shapes).toHaveLength(1);
        act(() => result.current.undo());
        expect(result.current.shapes).toHaveLength(0);
        act(() => result.current.undo()); // empty history is a no-op
        expect(result.current.shapes).toHaveLength(0);
    });

    it("recolors and removes a shape, clearing selection", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const id = result.current.shapes[0].id;
        act(() => result.current.recolor(id, "#8bc34a"));
        expect(result.current.shapes[0].color).toBe("#8bc34a");
        act(() => result.current.removeShape(id));
        expect(result.current.shapes).toHaveLength(0);
        expect(result.current.selectedId).toBeNull();
    });

    it("pastes a clone offset from the source", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const src = result.current.shapes[0];
        act(() => result.current.pasteShape(src));
        expect(result.current.shapes).toHaveLength(2);
        const clone = result.current.shapes[1];
        expect(clone.id).not.toBe(src.id);
        expect(clone.x).toBeGreaterThan(src.x);
    });

    it("updateShape patches only the target shape", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const id = result.current.shapes[0].id;
        act(() => result.current.updateShape(id, (s) => ({ ...s, x: 40 })));
        expect(result.current.shapes[0].x).toBe(40);
    });

    it("clearAll empties the canvas and undo restores it", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        act(() => result.current.clearAll());
        expect(result.current.shapes).toHaveLength(0);
        act(() => result.current.undo());
        expect(result.current.shapes).toHaveLength(1);
    });

    it("freehand stroke paints cells into one shape", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.startStroke());
        act(() => {
            result.current.paintCell(2, 2);
            result.current.paintCell(3, 2);
        });
        const free = result.current.shapes[0];
        expect(free.type).toBe("free");
        expect(free.cells?.length).toBe(2);
    });

    it("fill needs an enclosure (no-op on open canvas), erase rubs a cell out", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.fill(5, 5)); // open canvas -> nothing added
        expect(result.current.shapes).toHaveLength(0);
        // wall off a single cell with a freehand stroke, then fill the hole
        act(() => result.current.startStroke());
        act(() => {
            result.current.paintCell(4, 5);
            result.current.paintCell(6, 5);
            result.current.paintCell(5, 4);
            result.current.paintCell(5, 6);
        });
        act(() => result.current.fill(5, 5));
        const filled = result.current.shapes[result.current.shapes.length - 1];
        expect(filled.cells).toContainEqual([5, 5]);
        act(() => result.current.eraseCell(5, 5));
        expect(result.current.shapes[result.current.shapes.length - 1].cells).not.toContainEqual([5, 5]);
    });

    it("erasing over a placed shape bakes it into free pixels", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const sq = result.current.shapes[0];
        const [cx, cy] = shapeCells(sq)[0];
        act(() => result.current.eraseCell(cx, cy));
        const baked = result.current.shapes[0];
        expect(baked.type).toBe("free");
        expect(baked.cells).not.toContainEqual([cx, cy]);
        expect(baked.cells!.length).toBeGreaterThan(0);
    });

    it("erasing over a rotated shape still hits via the expanded bbox", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const id = result.current.shapes[0].id;
        act(() => result.current.updateShape(id, (s) => ({ ...s, angle: 45 })));
        const [cx, cy] = shapeCells(result.current.shapes[0])[0];
        act(() => result.current.eraseCell(cx, cy));
        expect(result.current.shapes[0].type).toBe("free");
    });

    it("erasing away from every shape is a no-op (fast reject)", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square")); // centered, far from the corner
        const before = result.current.shapes[0];
        act(() => result.current.eraseCell(0, 0));
        expect(result.current.shapes[0]).toEqual(before);
    });

    it("paintCell before a stroke starts is a no-op", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.paintCell(1, 1));
        expect(result.current.shapes).toHaveLength(0);
    });

    it("erasing inside a shape's bbox but off its pixels leaves it alone", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("circle")); // a circle leaves its bbox corners empty
        const c = result.current.shapes[0];
        const filled = new Set(shapeCells(c).map(([x, y]) => `${x},${y}`));
        let target: [number, number] | null = null;
        for (let gx = Math.round(c.x / CELL); gx < Math.round((c.x + c.w) / CELL) && !target; gx++) {
            for (let gy = Math.round(c.y / CELL); gy < Math.round((c.y + c.h) / CELL); gy++) {
                if (!filled.has(`${gx},${gy}`)) {
                    target = [gx, gy];
                    break;
                }
            }
        }
        expect(target).not.toBeNull();
        const before = result.current.shapes[0];
        act(() => result.current.eraseCell(target![0], target![1]));
        expect(result.current.shapes[0]).toEqual(before); // untouched
    });

    it("getShape looks a shape up by id", () => {
        const { result } = renderHook(() => useEditor());
        act(() => result.current.addShape("square"));
        const id = result.current.shapes[0].id;
        expect(result.current.getShape(id)?.id).toBe(id);
        expect(result.current.getShape("nope")).toBeNull();
    });
});
