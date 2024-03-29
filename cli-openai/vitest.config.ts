/// <reference types="vitest" />
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  test: {
    include: ["./test/**/*.ts"]
  },
  resolve: {
    alias: {
      "@effect/docgen": path.resolve(__dirname, "src")
    }
  }
})
