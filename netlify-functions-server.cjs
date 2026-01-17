/**
 * Local development server to simulate Netlify Functions
 * Run this with: node netlify-functions-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
require('dotenv').config();

const PORT = 8888;

// MIME types for different file extensions
const mimeTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

// Load and execute the Netlify Function
const loadFunction = (functionName) => {
  try {
    // Try .cjs extension first (for ES module projects)
    let functionPath = path.join(__dirname, 'netlify', 'functions', `${functionName}.cjs`);
    if (!fs.existsSync(functionPath)) {
      // Fallback to .js extension
      functionPath = path.join(__dirname, 'netlify', 'functions', `${functionName}.js`);
    }
    
    if (fs.existsSync(functionPath)) {
      // Clear require cache to reload changes
      delete require.cache[require.resolve(functionPath)];
      return require(functionPath);
    }
    return null;
  } catch (error) {
    console.error(`Error loading function ${functionName}:`, error);
    return null;
  }
};

// Create mock event object for Netlify Function
const createMockEvent = (req, pathname, searchParams) => {
  return {
    httpMethod: req.method,
    path: pathname,
    queryParameters: Object.fromEntries(searchParams),
    headers: req.headers,
    body: null, // For simplicity, not handling request body in this mock
  };
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  console.log(`${req.method} ${pathname}`);

  // Handle Netlify Function requests
  if (pathname.startsWith('/.netlify/functions/')) {
    const functionName = pathname.replace('/.netlify/functions/', '');
    const func = loadFunction(functionName);

    if (func && func.handler) {
      const event = createMockEvent(req, pathname, url.searchParams);
      
      func.handler(event).then(response => {
        res.writeHead(response.statusCode || 200, response.headers);
        res.end(response.body);
      }).catch(error => {
        console.error('Function error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Function not found' }));
    }
    return;
  }

  // Serve static files (for development)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // If it's a directory, try to serve index.html
  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Netlify Functions development server running on http://localhost:${PORT}`);
  console.log(`📁 Serving functions from: ${path.join(__dirname, 'netlify', 'functions')}`);
  console.log(`🔧 Make sure your Vite dev server is running on http://localhost:5173`);
  console.log(`📝 Environment variables loaded from .env file`);
});