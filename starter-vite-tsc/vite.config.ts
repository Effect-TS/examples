import { defineConfig } from "vite";
import { effectPlugin } from "@effect/vite-plugin";

export default defineConfig({
  plugins: [effectPlugin()],
});
