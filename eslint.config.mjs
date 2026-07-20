import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = [
    { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
    {
        files: ["**/*.{ts,tsx,js,mjs}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
        },
        plugins: { "@next/next": nextPlugin, "jsx-a11y": jsxA11y },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            ...jsxA11y.flatConfigs.recommended.rules,
        },
    },
];

export default eslintConfig;
