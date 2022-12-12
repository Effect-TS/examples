import { defineConfig } from "vite";
import * as effect from "@effect/vite-plugin";

export default defineConfig({
  plugins: [effect.tsPlugin()],
});
