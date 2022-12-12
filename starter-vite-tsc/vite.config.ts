import { defineConfig } from "vite";
import { effectPlugin } from "@effect/vite-plugin-react";

export default defineConfig({
  plugins: [effectPlugin()],
});
