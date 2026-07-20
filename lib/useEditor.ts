"use client";
import { useRef, useState, useCallback } from "react";
import { type Shape, type ShapeType, newShape, CANVAS_W, CANVAS_H, PALETTE } from "@/lib/shapes";

/** Owns the drawing state: shapes, selection, active color, and the two names. */
export function useEditor() {
    const idc = useRef(0);
    const nextId = () => `s${++idc.current}`;

    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [color, setColor] = useState<string>(PALETTE[2]);
    const [drawingName, setDrawingName] = useState("My Drawing");
    const [studentName, setStudentName] = useState("Norden Heng");

    const addShape = useCallback(
        (type: ShapeType) => {
            const id = nextId();
            setShapes((prev) => [...prev, newShape(id, type, CANVAS_W / 2, CANVAS_H / 2, color)]);
            setSelectedId(id);
        },
        [color],
    );

    const updateShape = useCallback((id: string, patch: (s: Shape) => Shape) => {
        setShapes((prev) => prev.map((s) => (s.id === id ? patch(s) : s)));
    }, []);

    const recolor = useCallback((id: string, c: string) => {
        setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, color: c } : s)));
    }, []);

    const removeShape = useCallback((id: string) => {
        setShapes((prev) => prev.filter((s) => s.id !== id));
        setSelectedId((cur) => (cur === id ? null : cur));
    }, []);

    const bringToFront = useCallback((id: string) => {
        setShapes((prev) => {
            const s = prev.find((x) => x.id === id);
            if (!s) return prev;
            return [...prev.filter((x) => x.id !== id), s];
        });
    }, []);

    const clearAll = useCallback(() => {
        setShapes([]);
        setSelectedId(null);
    }, []);

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
        bringToFront,
        clearAll,
    };
}
