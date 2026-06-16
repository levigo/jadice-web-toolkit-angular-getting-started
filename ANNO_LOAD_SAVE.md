# JWV 7 (Angular): Annotation Loading and Saving

## Selection Criteria

Use `tutorial-002` if one of these is required:

- Project-specific Java logic during save.
- Custom serialization, routing, or save-time business rules.

Use `tutorial-003` if all of these are true:

- HTTP endpoint persistence is sufficient.
- `webtoolkit.annotation.save.http.*` configuration covers the contract.
- No custom Java save handler is required.

## Loading & Saving Annotations

Loading:

- Client opens a document source with annotation URIs (`annotationUrisList` in these tutorials).
- Viewer loads and renders annotation streams.

Saving:

- Client sends `SAVE_ANNOS` with `saveStreamId`, `saveAnnotationsHandlerId`, `annoFormat`.
- Server resolves `saveAnnotationsHandlerId`.
- Handler serializes and persists annotation data.

## Tutorial-002 (Custom Handler)

Client payload:

- `saveStreamId: "test93.xml"`
- `saveAnnotationsHandlerId: "SaveJadiceAnnotationsHandler"`
- `annoFormat: "JADICE"`

Storage target in tutorial:

- `http://localhost:3000/test93.xml` (raw binary POST)

Relevant implementation:

- `tutorial-002/client/src/root/app.component.ts`: sends `SAVE_ANNOS` with `SaveJadiceAnnotationsHandler` and `test93.xml`.
- `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/annotation/SaveJadiceAnnotationsHandler.java`: serializes annotations and POSTs raw binary data. Annotated with `@Component`; since jadice web toolkit 7 it is auto-registered as save handler.
- `tutorial-002/server/src/main/resources/application.yml`: contains custom save config (`annotation.save.*`) and auth.

## Tutorial-003 (Built-in HTTP Handler)

Client payload:

- `saveStreamId: "test103.xml"`
- `saveAnnotationsHandlerId: "HttpSaveJadiceAnnotationsHandler"`
- `annoFormat: "JADICE"`

Server config:

- `webtoolkit.annotation.save.http.enabled: true`
- `webtoolkit.annotation.save.http.base-url: http://localhost:3000`
- `webtoolkit.annotation.save.http.url-template: "{baseUrl}/{streamId}"`

Storage target in tutorial:

- `http://localhost:3000/test103.xml` (raw binary POST)

Relevant implementation:

- `tutorial-003/client/src/root/app.component.ts`: sends `SAVE_ANNOS` with `HttpSaveJadiceAnnotationsHandler` and `test103.xml`.
- `tutorial-003/server/src/main/resources/application.yml`: configures the built-in handler (`webtoolkit.annotation.save.http.*`).
- `tutorial-003/server/src/main/java/org/jadice/jwv/tutorial/JadiceWebViewerApplicationGSConfig.java`: contains tutorial bootstrap without custom save-handler registration.

## Local Start: Tutorial-002

1. Start storage server:

```bash
cd tutorial-002/test-server-basic-auth
npm i
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

2. Start backend:

```bash
cd tutorial-002/server
mvn spring-boot:run -Dspring-boot.run.main-class=org.jadice.jwv.tutorial.JadiceWebViewerApplication002
```

3. Start client:

```bash
cd tutorial-002/client
npm i
npm start
```

## Local Start: Tutorial-003

1. Start storage server:

```bash
cd tutorial-003/test-server-basic-auth
npm i
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

2. Start backend:

```bash
cd tutorial-003/server
mvn spring-boot:run -Dspring-boot.run.main-class=org.jadice.jwv.tutorial.JadiceWebViewerApplication003
```

3. Start client:

```bash
cd tutorial-003/client
npm i
npm start
```

## Verification

1. Open `http://localhost:4200`.
2. Add or edit an annotation.
3. Click Save.
4. Reload the page.
5. Verify persisted data is reloaded (`tutorial-002`: `test93.xml`, `tutorial-003`: `test103.xml`).

## Common Issues

Unknown save handler:

- Cause: `saveAnnotationsHandlerId` does not match registered server handler.
- Check handler IDs (`tutorial-002`: `SaveJadiceAnnotationsHandler`, `tutorial-003`: `HttpSaveJadiceAnnotationsHandler`).

HTTP 404 when loading annotations:

- Cause: wrong URI or missing file in `public/`.
- Check `annotationUrisList` and storage server path/port.

Save appears successful, file not updated:

- Cause: upload contract mismatch.
- For these tutorials, use raw binary POST to `/{filename}` (no `?upload`).

Auth errors:

- Align credentials across storage server startup flags, `ddp.http.authentication`, and save-auth configuration.
