const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const HOST = '0.0.0.0';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const httpServer = http.createServer((req, res) => {
  serveFile(req, res);
});

// HTTPS server (self-signed certificate for development)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
};

const httpsServer = https.createServer(httpsOptions, (req, res) => {
  serveFile(req, res);
});

// File serving function
function serveFile(req, res) {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1><p>Sorry, something went wrong.</p>', 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
}

// Generate self-signed certificate (for development)
function generateSelfSignedCert() {
  const { execSync } = require('child_process');
  
  if (!fs.existsSync('server.key') || !fs.existsSync('server.crt')) {
    console.log('Generating self-signed SSL certificate...');
    try {
      execSync('openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
      console.log('SSL certificate generated successfully!');
    } catch (error) {
      console.log('OpenSSL not found. Please install OpenSSL or provide your own certificate.');
      console.log('For development, you can use: npm install -g openssl');
      process.exit(1);
    }
  }
}

// Start servers
function startServers() {
  // Generate SSL certificate if needed
  generateSelfSignedCert();

  // Start HTTP server
  httpServer.listen(HTTP_PORT, HOST, () => {
    console.log(`HTTP server running at http://${HOST}:${HTTP_PORT}/`);
    console.log(`Access your website at: http://localhost:${HTTP_PORT}/`);
  });

  // Start HTTPS server
  httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`HTTPS server running at https://${HOST}:${HTTPS_PORT}/`);
    console.log(`Access your website at: https://localhost:${HTTPS_PORT}/`);
    console.log('\nNote: Using self-signed certificate - browser will show security warning (click "Advanced" -> "Proceed to localhost")');
  });

  console.log('\n🚀 EC-Labs Website Server Started!');
  console.log('=====================================');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  httpServer.close(() => {
    httpsServer.close(() => {
      console.log('✅ Servers stopped successfully');
      process.exit(0);
    });
  });
});

// Start the servers
startServers();
