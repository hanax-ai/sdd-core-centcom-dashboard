/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * CP-7 — Vitest config isolated from the app's TanStack Start pipeline.
 *
 * We do not extend the app's vite.config (which pulls in nitro / SSR
 * plugins that fight vitest). Tests only need path-alias resolution
 * plus a node environment.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".output/**", "dist/**"],
    reporters: "default",
  },
});
