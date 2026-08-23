import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const publicRoot = path.resolve(process.cwd(), "dist");
const host = process.env.SITE_HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const types = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

function resolveRequest(urlValue) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlValue, "http://localhost").pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) return null;
  const relative = pathname.endsWith("/") ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  const candidate = path.resolve(publicRoot, relative || "index.html");
  const prefix = `${publicRoot}${path.sep}`;
  return candidate.startsWith(prefix) ? candidate : null;
}

const server = createServer(async (request, response) => {
  const file = resolveRequest(request.url || "/");
  if (!file) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    const extension = path.extname(file).toLowerCase();
    const relative = path.relative(publicRoot, file).replaceAll("\\", "/");
    const cacheControl = relative.startsWith("art/optimized/")
      ? "public, max-age=300"
      : "no-cache";
    response.writeHead(200, {
      "Cache-Control": cacheControl,
      "Content-Length": info.size,
      "Content-Type": types.get(extension) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else response.end(await readFile(file));
  } catch {
    response.writeHead(404, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Lucky Lots test server: http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
