import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as effect from "@effect/vite-plugin";

export default defineConfig({
  plugins: [effect.tsPlugin(), react()],
});
