import { type Shape, exportFilename, CANVAS_W, CANVAS_H } from "@/lib/shapes";
import { paintScene, type Nameplate } from "@/lib/render";

/** Render the shapes (+ name header) to a clean offscreen PNG at 2x. */
function renderPng(shapes: Shape[], nameplate: Nameplate, scale = 2): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * scale;
    canvas.height = CANVAS_H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas unsupported"));
    ctx.scale(scale, scale);
    paintScene(ctx, shapes, nameplate);
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render image"))), "image/png"));
}

/**
 * Save the drawing to Photos. On iOS/iPadOS the Web Share API opens the native
 * share sheet with "Save Image"; elsewhere it falls back to a PNG download.
 */
export async function exportShapes(shapes: Shape[], drawingName: string, nameplate: Nameplate): Promise<"shared" | "downloaded"> {
    const filename = exportFilename(drawingName);
    const blob = await renderPng(shapes, nameplate);
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
    a.style.display = "none";
    document.body.appendChild(a); // some browsers only fire downloads for attached anchors
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
}
