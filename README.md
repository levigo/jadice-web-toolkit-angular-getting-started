# JwvGettingStarted

This repository is structured as a step-by-step tutorial history: each commit adds a small functional increment.

The current branch (`main-ng21-jwt7`) targets jadice web toolkit 7 with Angular 21 and currently includes:
- `tutorial-000`: base Angular + Spring Boot scaffold
- `tutorial-001`: viewer integration and core features
- `tutorial-002`: annotation loading and saving with a custom server save handler
- `tutorial-003`: annotation loading and saving with the built-in HTTP save handler

## Prerequisites

- Java 17 (required for server modules)
- Node.js LTS (20.x or 22.x recommended)
- npm

## Follow The Tutorial Character

To follow the tutorial in incremental steps, inspect the commit history from oldest to newest:

```bash
git log --oneline --reverse
```

## Run Tutorial-001

1. Start the server (`tutorial-001/server`) with main class `org.jadice.jwv.tutorial.JadiceWebViewerApplication001`.
2. Start the client:
   ```bash
   cd tutorial-001/client
   npm i
   npm start
   ```
3. Open `http://localhost:4200`.

## Run Tutorial-002 (Custom Save Handler)

1. Start the demo annotation storage server:
   ```bash
   cd tutorial-002/test-server-basic-auth
   npm i
   node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
   ```
2. Start the server (`tutorial-002/server`) with main class `org.jadice.jwv.tutorial.JadiceWebViewerApplication002`.
3. Start the client:
   ```bash
   cd tutorial-002/client
   npm i
   npm start
   ```
4. Open `http://localhost:4200`, add or edit an annotation, click save (toolbar or menu), then reload to verify persistence.

The repo ships `tutorial-002/test-server-basic-auth/public/test93.xml`, so annotation loading works on first run. It also ships `test93.rendercontrols.json`, so the document loads with its stored render controls (the first page rotated 90°) applied on load, and rotations you make in the client are saved back together with the annotations.

Detailed tutorial-002 notes are in `tutorial-002/README.md`.

## Run Tutorial-003 (Built-in HTTP Save Handler)

1. Start the demo annotation storage server:
   ```bash
   cd tutorial-003/test-server-basic-auth
   npm i
   node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
   ```
2. Start the server (`tutorial-003/server`) with main class `org.jadice.jwv.tutorial.JadiceWebViewerApplication003`.
3. Start the client:
   ```bash
   cd tutorial-003/client
   npm i
   npm start
   ```
4. Open `http://localhost:4200`, add or edit an annotation, click save, then reload to verify persistence.

The repo ships `tutorial-003/test-server-basic-auth/public/test103.xml`, so annotation loading works on first run.

Detailed tutorial-003 notes are in `tutorial-003/README.md`.
