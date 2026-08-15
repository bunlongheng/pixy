"use client";
import { useRef, useState, useCallback } from "react";
import {
    type Shape,
    type ShapeType,
    newShape,
    newFreeShape,
    addFreeCell,
    shapeCells,
    occupiedCells,
    floodFill,
    snap,
    clamp,
    CANVAS_W,
    CANVAS_H,
    CELL,
} from "@/lib/shapes";

/** Owns the drawing state: shapes, selection, active color, names, and undo history. */
export function useEditor() {
    const idc = useRef(0);
    const nextId = () => `s${++idc.current}`;
    const past = useRef<Shape[][]>([]);
    const strokeId = useRef<string | null>(null);

    const [shapes, setShapes] = useState<Shape[]>([]);
    const shapesRef = useRef(shapes);
    shapesRef.current = shapes; // always mirror the latest committed shapes for synchronous reads
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [color, setColor] = useState<string>("#e11d2a"); // default to red
    const [drawingName, setDrawingName] = useState("My Drawing");
    const [studentName, setStudentName] = useState("Norden Heng");

    // Record the current shapes for undo. Synchronous read of a ref (no setState side effect),
    // so it is reliable under React strict mode and never records a phantom no-op entry.
    const snapshot = useCallback(() => {
        past.current.push(shapesRef.current);
        if (past.current.length > 60) past.current.shift();
    }, []);

    const undo = useCallback(() => {
        const prev = past.current.pop();
        if (prev === undefined) return;
        setShapes(prev);
        setSelectedId(null);
    }, []);

    const addShape = useCallback(
        (type: ShapeType) => {
            snapshot();
            const id = nextId();
            setShapes((prev) => [...prev, newShape(id, type, CANVAS_W / 2, CANVAS_H / 2, color)]);
            setSelectedId(id);
        },
        [color, snapshot],
    );

    const pasteShape = useCallback(
        (shape: Shape) => {
            snapshot();
            const id = nextId();
            const clone: Shape = {
                ...shape,
                id,
                x: clamp(snap(shape.x + CELL * 2), 0, CANVAS_W - shape.w),
                y: clamp(snap(shape.y + CELL * 2), 0, CANVAS_H - shape.h),
            };
            setShapes((prev) => [...prev, clone]);
            setSelectedId(id);
        },
        [snapshot],
    );

    const updateShape = useCallback((id: string, patch: (s: Shape) => Shape) => {
        setShapes((prev) => prev.map((s) => (s.id === id ? patch(s) : s)));
    }, []);

    // Freehand: start a stroke (one undo entry), then paint / erase grid cells.
    const startStroke = useCallback(() => {
        snapshot();
        const id = nextId();
        strokeId.current = id;
        setShapes((prev) => [...prev, newFreeShape(id, color)]);
        setSelectedId(null);
    }, [color, snapshot]);

    const paintCell = useCallback((cx: number, cy: number) => {
        const id = strokeId.current;
        if (!id) return;
        setShapes((prev) => prev.map((s) => (s.id === id ? addFreeCell(s, cx, cy) : s)));
    }, []);

    // Paint bucket: spill the current color into the enclosed empty region around (cx,cy).
    // Does nothing if the area is not closed (floodFill returns []), so history stays clean.
    const fill = useCallback(
        (cx: number, cy: number) => {
            const cur = shapesRef.current;
            const cells = floodFill(occupiedCells(cur), cx, cy);
            if (!cells.length) return;
            snapshot();
            setShapes([...cur, { id: nextId(), type: "free", x: 0, y: 0, w: 0, h: 0, color, cells }]);
            setSelectedId(null);
        },
        [color, snapshot],
    );

    // Erase one grid cell, like a 1-block pencil. A placed shape gets baked into pixels
    // the first time the eraser touches it, so shapes rub out cell-by-cell just like freehand.
    const eraseCell = useCallback((cx: number, cy: number) => {
        const px = cx * CELL + CELL / 2;
        const py = cy * CELL + CELL / 2;
        setShapes((prev) =>
            prev.map((s) => {
                if (s.type === "free") return { ...s, cells: (s.cells ?? []).filter(([x, y]) => !(x === cx && y === cy)) };
                // fast reject: skip shapes whose (rotation-aware) bbox can't contain this cell
                const R = s.angle ? Math.hypot(s.w, s.h) / 2 : 0;
                const ccx = s.x + s.w / 2;
                const ccy = s.y + s.h / 2;
                const minX = s.angle ? ccx - R : s.x;
                const maxX = s.angle ? ccx + R : s.x + s.w;
                const minY = s.angle ? ccy - R : s.y;
                const maxY = s.angle ? ccy + R : s.y + s.h;
                if (px < minX || px > maxX || py < minY || py > maxY) return s;
                const cells = shapeCells(s);
                if (!cells.some(([x, y]) => x === cx && y === cy)) return s; // not under the eraser
                // bake the shape into pixels so it rubs out cell-by-cell from here on
                return { ...s, type: "free", angle: 0, x: 0, y: 0, w: 0, h: 0, cells: cells.filter(([x, y]) => !(x === cx && y === cy)) };
            }),
        );
    }, []);

    const recolor = useCallback(
        (id: string, c: string) => {
            snapshot();
            setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, color: c } : s)));
        },
        [snapshot],
    );

    const removeShape = useCallback(
        (id: string) => {
            snapshot();
            setShapes((prev) => prev.filter((s) => s.id !== id));
            setSelectedId((cur) => (cur === id ? null : cur));
        },
        [snapshot],
    );

    const clearAll = useCallback(() => {
        snapshot();
        setShapes([]);
        setSelectedId(null);
    }, [snapshot]);

    const getShape = useCallback((id: string | null) => shapes.find((s) => s.id === id) ?? null, [shapes]);

    return {
        shapes,
        selectedId,
        setSelectedId,
        color,
        setColor,
        drawingName,
        setDrawingName,
        studentName,
        setStudentName,
        addShape,
        updateShape,
        recolor,
        removeShape,
        clearAll,
        snapshot,
        undo,
        pasteShape,
        getShape,
        startStroke,
        paintCell,
        eraseCell,
        fill,
    };
}
