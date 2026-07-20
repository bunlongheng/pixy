import { type Shape, exportFilename, CANVAS_W, CANVAS_H } from "@/lib/shapes";
import { paintScene } from "@/lib/render";

/** Render the shapes to a clean offscreen PNG (no selection chrome), at 2x. */
function renderPng(shapes: Shape[], scale = 2): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * scale;
    canvas.height = CANVAS_H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas unsupported"));
    ctx.scale(scale, scale);
    paintScene(ctx, shapes);
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render image"))), "image/png"));
}

/**
 * Save the drawing to Photos. On iOS/iPadOS the Web Share API opens the native
 * share sheet with "Save Image" (the reliable path into Photos); elsewhere it
 * falls back to a PNG download. Returns how it was delivered.
 */
export async function exportShapes(shapes: Shape[], drawingName: string): Promise<"shared" | "downloaded"> {
    const filename = exportFilename(drawingName);
    const blob = await renderPng(shapes);
    const file = new File([blob], filename, { type: "image/png" });

    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try {
            await nav.share({ files: [file], title: drawingName });
            return "shared";
        } catch (err) {
            if ((err as Error).name === "AbortError") return "shared";
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
}
