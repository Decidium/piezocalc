// Serves this folder over http so the app can install as a PWA and be tested on a phone.
// Run: node ppc-serve.js   then open the printed address.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.argv[2]) || 8080;
const ROOT = __dirname;
const APP = 'index.html';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.csv': 'text/csv; charset=utf-8'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/' + APP;
  const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type': 'text/plain'}).end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log(`Serving ${ROOT}`);
  console.log(`  local:   http://localhost:${PORT}/`);
  ips.forEach(ip => console.log(`  network: http://${ip}:${PORT}/   (open this on the phone)`));
  console.log('Stop with Ctrl+C');
});
