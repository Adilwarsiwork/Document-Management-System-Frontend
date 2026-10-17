import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The document bucket does not send CORS headers, so a browser cannot read a
// file it requests directly. The dev server relays those requests, which makes
// them same-origin and lets the download button read the bytes. A deployed app
// needs the bucket CORS rule in docs/s3-cors.json instead.
const STORAGE_BUCKET =
  "https://allsoft-consulting.s3.ap-south-1.amazonaws.com";

const storageProxy = {
  "/storage": {
    target: STORAGE_BUCKET,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/storage/, ""),
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { proxy: storageProxy },
});
