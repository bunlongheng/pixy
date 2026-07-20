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
            include: ["lib/**"],
            reporter: ["text", "html"],
            thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
        },
    },
});
