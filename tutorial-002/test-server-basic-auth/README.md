# Static Server with Basic Auth and File Upload

A lightweight HTTP server for serving static files with basic authentication and file upload capabilities.

## Installation

1. Clone or download the project
2. Install dependencies:

```bash
npm install
```

Required dependencies:
- mime-types
- minimist
- formidable

## Usage

```bash
node static-server.js [options]
```

### Options

| Option            | Description                               | Default   |
|-------------------|-------------------------------------------|-----------|
| `-p, --port`      | Port to use                               | 8080      |
| `-a, --auth`      | Enable basic authentication               | false     |
| `-u, --username`  | Username for authentication               | admin     |
| `-w, --password`  | Password for authentication               | admin     |
| `-d, --dir`       | Directory to serve                        | ./        |
| `-l, --upload`    | Enable file uploads                       | true      |
| `-h, --help`      | Display help message                      |           |

### Example

```bash
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

This command:
- Starts the server on port 3000
- Serves files from the `./public` directory
- Enables basic authentication with username "user1" and password "test"

## Features

### Static File Serving

The server can serve static files from the specified directory. It automatically handles:
- Directory listings
- Index files (serves `index.html` if it exists in a directory)
- Proper MIME types for different file extensions

### Basic Authentication

When authentication is enabled (`--auth`), all requests to the server will require basic HTTP authentication. The server will respond with a 401 Unauthorized status code and prompt for credentials if:
- No authentication credentials are provided
- Invalid credentials are provided

### File Uploads

The server supports two methods of file uploads:

#### 1. Browser Form Upload

Access any directory and use the upload form provided on the directory listing page. This allows you to upload files using a standard HTML form.

#### 2. Command Line Upload

Use curl or any HTTP client to upload files:

```bash
# Form-based upload
curl -X POST -F "file=@/path/to/your/file.txt" http://localhost:8080/path/to/upload/directory?upload

# Raw binary upload with specific filename
curl -X POST --data-binary @/path/to/your/file.txt http://localhost:8080/path/to/upload/directory/filename.txt

# With authentication
curl -X POST -F "file=@/path/to/your/file.txt" -u username:password http://localhost:8080/path/to/upload/directory?upload
```

## Security Considerations

- This is only a test server with basic auth
- The server includes protection against directory traversal attacks
- Basic authentication sends credentials in base64 encoding (not encrypted), so use over trusted networks or with HTTPS
- File uploads are limited to 200MB by default

## Limitations

- No built-in HTTPS support
- No user management (single username/password for authentication)
- No file compression

## Troubleshooting

- If your file uploads appear with random names, check for Content-Disposition headers in your requests
