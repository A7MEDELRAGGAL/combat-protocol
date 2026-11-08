import { cp, mkdir, rm, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of ["index.html", "css", "js", "vendor"]) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

await writeFile(resolve(dist, ".nojekyll"), "");
await writeFile(resolve(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
await writeFile(
  resolve(dist, "_headers"),
  [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  X-Frame-Options: SAMEORIGIN",
    "",
    "/js/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/vendor/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/css/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/index.html",
    "  Cache-Control: no-cache",
    "",
  ].join("\n"),
);
await writeFile(resolve(dist, "_redirects"), "/* /index.html 200\n");

let total = 0;
async function walk(path) {
  const info = await stat(path);
  if (info.isFile()) {
    total += info.size;
    return;
  }
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(path)) await walk(resolve(path, entry));
}
await walk(dist);
console.log(`dist ready: ${(total / 1024 / 1024).toFixed(2)} MB`);
