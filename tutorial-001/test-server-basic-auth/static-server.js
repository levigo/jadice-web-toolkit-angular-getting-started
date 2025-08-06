#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mime = require('mime-types');
const parseArgs = require('minimist');
const { IncomingForm } = require('formidable');

// Parse command line arguments
const argv = parseArgs(process.argv.slice(2), {
    string: ['username', 'password', 'dir'],
    boolean: ['auth', 'help', 'upload'],
    alias: {
        p: 'port',
        a: 'auth',
        u: 'username',
        w: 'password',
        d: 'dir',
        h: 'help',
        l: 'upload'
    },
    default: {
        port: 8080,
        auth: false,
        dir: './',
        username: 'admin',
        password: 'admin',
        upload: true
    }
});

// Show help
if (argv.help) {
    console.log(`
  Simple static HTTP server with basic auth and file upload support

  Usage: node static-server.js [options]

  Options:
    -p, --port       Port to use [8080]
    -a, --auth       Enable basic authentication [false]
    -u, --username   Username for authentication [admin]
    -w, --password   Password for authentication [admin]
    -d, --dir        Directory to serve [./]
    -l, --upload     Enable file uploads [true]
    -h, --help       Display this help message
  `);
    process.exit(0);
}

// Authentication function
function authenticate(req, res) {
    // If auth is disabled, proceed
    if (!argv.auth) {
        return true;
    }

    // Check for authorization header
    const auth = req.headers.authorization;
    if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Authentication required');
        return false;
    }

    // Parse authorization header
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    const username = credentials[0];
    const password = credentials[1];

    // Check credentials
    if (username === argv.username && password === argv.password) {
        return true;
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Invalid credentials');
        return false;
    }
}

// Function to handle file uploads
function handleFileUpload(req, res, targetDir) {
    // Check if uploads are enabled
    if (!argv.upload) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('File uploads are disabled');
        return;
    }

    // Setup the form to process file uploads
    const form = new IncomingForm({
        uploadDir: targetDir,
        keepExtensions: true,
        maxFileSize: 200 * 1024 * 1024, // 200MB limit
        multiples: true
    });

    // Process the uploaded files
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error processing upload');
            return;
        }

        // Handle uploaded files
        const fileDetails = [];

        // Process individual file or multiple files
        const fileList = files.file || [];
        const fileArray = Array.isArray(fileList) ? fileList : [fileList];

        fileArray.forEach(file => {
            if (!file || !file.filepath) return;

            // Extract filename from path if originalFilename is not available
            // Use basename from the filename parameter or from the request URL as fallback
            let originalFilename = file.originalFilename;

            // If originalFilename is undefined, try to get it from Content-Disposition header
            if (!originalFilename && req.headers['content-disposition']) {
                const match = req.headers['content-disposition'].match(/filename="([^"]+)"/);
                if (match) {
                    originalFilename = match[1];
                }
            }

            // If still undefined, use saveStreamId from URL path as fallback
            if (!originalFilename) {
                // Extract filename from URL path
                const pathParts = req.url.split('/');
                const lastPart = pathParts[pathParts.length - 1].split('?')[0];
                originalFilename = lastPart || path.basename(file.filepath);
            }

            console.log('File object:', JSON.stringify(file, null, 2));
            const targetPath = path.join(targetDir, originalFilename);
            console.log('Original path:', file.filepath);
            console.log('Target path:', targetPath);
            const logMessage = `${new Date().toISOString()}: ${JSON.stringify(file, null, 2)}\n, targetPath ${targetPath}`;
            const logFile = path.join(__dirname, 'server.log');
            fs.appendFileSync(logFile, logMessage);

            // Don't rename if the path already matches the target path
            if (file.filepath !== targetPath) {
                try {
                    fs.renameSync(file.filepath, targetPath);
                    fileDetails.push({
                        originalName: originalFilename,
                        size: file.size,
                        path: targetPath
                    });
                } catch (err) {
                    console.error(`Error moving uploaded file: ${err.message}`);
                    fileDetails.push({
                        originalName: originalFilename,
                        size: file.size,
                        path: file.filepath,
                        error: 'Failed to move file to target location'
                    });
                }
            } else {
                fileDetails.push({
                    originalName: originalFilename,
                    size: file.size,
                    path: file.filepath
                });
            }
        });

        // Send success response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `${fileDetails.length} file(s) uploaded successfully`,
            files: fileDetails
        }));
    });
}

// Function to handle raw binary data upload
function handleRawUpload(req, res, targetDir, filename) {
    // Check if uploads are enabled
    if (!argv.upload) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('File uploads are disabled');
        return;
    }

    // Create a writable stream to save the file
    const targetPath = path.join(targetDir, filename);
    const fileWriteStream = fs.createWriteStream(targetPath);

    // Track upload size
    let uploadSize = 0;

    // Handle errors on the writable stream
    fileWriteStream.on('error', (err) => {
        console.error('Error writing file:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error saving file');
    });

    // Handle completion of the write
    fileWriteStream.on('finish', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'File uploaded successfully',
            file: {
                name: filename,
                size: uploadSize,
                path: targetPath
            }
        }));
    });

    // Pipe the request data to the file
    req.on('data', (chunk) => {
        uploadSize += chunk.length;
    });

    req.pipe(fileWriteStream);
}

// Function to serve a file
function serveFile(req, res, filePath) {
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
            return;
        }

        // If it's a directory, serve index.html if it exists or show directory listing
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');

            fs.access(indexPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    // index.html exists, serve it
                    serveFile(req, res, indexPath);
                } else {
                    // Show directory listing
                    fs.readdir(filePath, (err, files) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('500 Internal Server Error');
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'text/html' });

                        let output = `<!DOCTYPE html>
            <html>
            <head>
              <title>Directory Listing: ${path.relative(argv.dir, filePath) || '/'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 5px 0; }
                a { color: #0366d6; text-decoration: none; }
                a:hover { text-decoration: underline; }
                #uploadForm { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
                .btn { padding: 6px 12px; background: #0366d6; color: white; border: none; border-radius: 3px; cursor: pointer; }
                .btn:hover { background: #0056b3; }
              </style>
            </head>
            <body>
              <h1>Directory: ${path.relative(argv.dir, filePath) || '/'}</h1>
              <ul>`;

                        // Add parent directory link if not in root
                        if (path.relative(argv.dir, filePath) !== '') {
                            output += `<li><a href="../..">../</a></li>`;
                        }

                        // Add files and directories
                        files.forEach(file => {
                            const fileStat = fs.statSync(path.join(filePath, file));
                            const isDirectory = fileStat.isDirectory();
                            output += `<li><a href="${file}${isDirectory ? '/' : ''}">${file}${isDirectory ? '/' : ''}</a></li>`;
                        });

                        output += `
              </ul>`;

                        // Add upload form if uploads are enabled
                        if (argv.upload) {
                            output += `
              <div id="uploadForm">
                <h2>Upload File</h2>
                <form method="post" enctype="multipart/form-data" action="?upload">
                  <input type="file" name="file" multiple />
                  <button class="btn" type="submit">Upload</button>
                </form>
                
                <h3>Or use curl to upload files:</h3>
                <pre>curl -X POST -F "file=@/path/to/your/file.txt" http://localhost:${argv.port}${req.url === '/' ? '' : req.url}?upload</pre>
                <pre>curl -X POST --data-binary @/path/to/your/file.txt http://localhost:${argv.port}${req.url === '/' ? '' : req.url}/filename.txt</pre>
              </div>`;
                        }

                        output += `
            </body>
            </html>`;

                        res.end(output);
                    });
                }
            });
            return;
        }

        // It's a file, serve it
        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        // Stream the file
        res.writeHead(200, { 'Content-Type': contentType });
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        });
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Check authentication
    if (!authenticate(req, res)) {
        return;
    }

    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Prevent directory traversal attacks
    const sanitizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(argv.dir, sanitizedPath);

    // Check if it's a POST request (file upload)
    if (req.method === 'POST') {
        // Check if request is to upload endpoint or contains a query parameter ?upload
        if (parsedUrl.query.upload !== undefined) {
            // Handle form-based file upload
            handleFileUpload(req, res, path.dirname(filePath));
            return;
        } else if (path.extname(sanitizedPath) !== '') {
            // Handle raw binary upload to a specific filename
            handleRawUpload(req, res, path.dirname(filePath), path.basename(filePath));
            return;
        } else {
            // Directory POST without specifying upload - default to form handling
            handleFileUpload(req, res, filePath);
            return;
        }
    }

    // Handle GET requests
    serveFile(req, res, filePath);
});

console.log(__dirname);

// Start server
server.listen(argv.port, () => {
    console.log(`
  Static server running at:
  - Address: http://localhost:${argv.port}
  - Directory: ${path.resolve(argv.dir)}
  - Authentication: ${argv.auth ? 'Enabled' : 'Disabled'}
  ${argv.auth ? `  - Credentials: ${argv.username}:${argv.password}` : ''}
  - File uploads: ${argv.upload ? 'Enabled' : 'Disabled'}
  
  Upload files:
  - Via browser: Open any directory and use the upload form
  - Via curl:
    curl -X POST -F "file=@/path/to/local/file.txt" http://localhost:${argv.port}/path/to/upload/directory?upload
    curl -X POST --data-binary @/path/to/local/file.txt http://localhost:${argv.port}/path/to/upload/directory/filename.txt
  
  Press Ctrl+C to stop
  `);
});
