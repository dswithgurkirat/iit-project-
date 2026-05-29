const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8080;

// Start build.js in watch mode as a child process
console.log('Starting compilation watcher...');
const watcher = spawn('node', ['build.js', '--watch'], { stdio: 'inherit' });

watcher.on('error', (err) => {
  console.error('Failed to start build watcher:', err);
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Decode URI to handle spaces and special characters in paths
  let filePath = decodeURIComponent(req.url.split('?')[0]);
  
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const fullPath = path.join(__dirname, filePath);

  // Basic security check to prevent directory traversal
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    
    const stream = fs.createReadStream(fullPath);
    stream.on('error', (streamErr) => {
      console.error(`Error reading file ${fullPath}:`, streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('\n==================================================');
  console.log(`🚀 Smart DSR Portal is running at:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log('==================================================\n');
});

// Ensure compiler child process is killed when the server shuts down
process.on('SIGINT', () => {
  watcher.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  watcher.kill();
  process.exit();
});
