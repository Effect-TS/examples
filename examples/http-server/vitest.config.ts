import { defineConfig } from "vitest/config"
import * as Path from "node:path"

export default defineConfig({
  test: {
    alias: {
      app: Path.join(__dirname, "src"),
    },
  },
})
