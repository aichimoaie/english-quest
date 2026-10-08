import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const [port, directory] = process.argv.slice(2);
const root = path.resolve(directory);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

async function resolveRequest(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const file = path.join(root, path.normalize(pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    return null;
  }
  for (const candidate of [file, `${file}.html`, path.join(file, 'index.html')]) {
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  return null;
}

createServer(async (request, response) => {
  const file = await resolveRequest(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': contentTypes[path.extname(file)] ?? 'application/octet-stream' });
  response.end(await readFile(file));
}).listen(Number(port), '127.0.0.1');
