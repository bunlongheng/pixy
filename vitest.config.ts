import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            // Gate the pure, deterministic logic. render.ts + exportImage.ts are canvas/Web-Share
            // side-effect code, covered by the Playwright e2e suite instead of unit coverage.
            include: ["lib/shapes.ts", "lib/useEditor.ts"],
            reporter: ["text", "html"],
            thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
        },
    },
});
