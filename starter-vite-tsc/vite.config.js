import react from "@vitejs/plugin-react"
// @ts-check
import { defineConfig } from "vite";
// import { effectPlugin } from "@effect/vite-plugin-react";

export default defineConfig({  
  plugins: [
    react(),
    // effectPlugin({
    //   babel: {
    //     plugins: ["babel-plugin-annotate-pure-calls"],
    //   },
    // }),
  ],
});
