import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  // Pin the project root so Next never picks up a lockfile from a parent folder.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // mupdf ships a WASM binary and pdf-lib is CJS: keep both out of the bundle.
  serverExternalPackages: ["mupdf", "pdf-lib"],
};

export default nextConfig;
