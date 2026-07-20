"use client";
import { useRef, useState, useCallback } from "react";
import { type Shape, type ShapeType, newShape, snap, clamp, CANVAS_W, CANVAS_H, CELL, PALETTE } from "@/lib/shapes";

/** Owns the drawing state: shapes, selection, active color, names, and undo history. */
export function useEditor() {
    const idc = useRef(0);
    const nextId = () => `s${++idc.current}`;
    const past = useRef<Shape[][]>([]);

    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [color, setColor] = useState<string>(PALETTE[2]);
    const [drawingName, setDrawingName] = useState("My Drawing");
    const [studentName, setStudentName] = useState("Norden Heng");

    // Snapshot current shapes for undo (no state change - React bails on the same ref).
    const snapshot = useCallback(() => {
        setShapes((cur) => {
            past.current.push(cur);
            if (past.current.length > 60) past.current.shift();
            return cur;
        });
    }, []);

    const undo = useCallback(() => {
        setShapes((cur) => {
            const prev = past.current.pop();
            return prev ?? cur;
        });
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
    };
}
