/// <reference types="vitest" />
import { defineConfig } from "vite"

export default defineConfig({
  test: {
    include: ["./test/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [],
    globals: true,
    coverage: {
      provider: "v8"
    }
  }
})
