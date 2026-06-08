import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fallbackPublicDir = path.join(rootDir, 'public');
const bundleDir = path.join(rootDir, 'bundle-disabled');
const runtimeDir = path.join(rootDir, '.runtime');
const runtimeZip = path.join(runtimeDir, 'fenster-kalkulation-app.zip');
const runtimePublicDir = path.join(runtimeDir, 'fenster-kalkulation-app', 'public');
const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

function getPublicDir() {
  try {
    if (!fs.existsSync(bundleDir)) return fallbackPublicDir;

    const partFiles = fs.readdirSync(bundleDir)
      .filter((name) => name.startsWith('fenster-kalkulation-app.zip.part') && name.endsWith('.b64'))
      .sort();

    if (partFiles.length === 0) return fallbackPublicDir;

    fs.rmSync(runtimeDir, { recursive: true, force: true });
    fs.mkdirSync(runtimeDir, { recursive: true });

    let zipText = '';
    for (const fileName of partFiles) {
      zipText += fs.readFileSync(path.join(bundleDir, fileName), 'utf8').trim();
    }

    fs.writeFileSync(runtimeZip, Buffer.from(zipText, 'base64'));
    execFileSync('unzip', ['-oq', runtimeZip, '-d', runtimeDir], { stdio: 'inherit' });

    if (fs.existsSync(path.join(runtimePublicDir, 'index.html'))) {
      console.log('Serving full bundled ZIP app');
      return runtimePublicDir;
    }
  } catch (error) {
    console.warn('Bundled ZIP startup failed, using fallback public folder.');
    console.warn(String(error && error.message ? error.message : error));
  }

  return fallbackPublicDir;
}

const publicDir = getPublicDir();

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    response.end(content);
  });
}

http.createServer((request, response) => {
  const safePath = decodeURIComponent(request.url.split('?')[0]).replace(/^\/+/, '');
  const requested = safePath || 'index.html';
  const filePath = path.normalize(path.join(publicDir, requested));

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, filePath);
      return;
    }
    sendFile(response, path.join(publicDir, 'index.html'));
  });
}).listen(port, () => {
  console.log(`Fenster Kalkulation running on port ${port}`);
});
