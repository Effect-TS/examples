import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/main.ts"],
  clean: true,
  publicDir: true,
  treeshake: "smallest",
  external: ["@parcel/watcher"]
})
