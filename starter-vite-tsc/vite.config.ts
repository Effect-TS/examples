import { defineConfig } from "vite";
import { effectPlugin } from "@effect/vite-plugin-react";

export default defineConfig({
  plugins: [
    effectPlugin({
      babel: {
        plugins: ["babel-plugin-annotate-pure-calls"],
      },
    }),
  ],
});
