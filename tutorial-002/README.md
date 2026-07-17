# Tutorial 002: Annotation Loading and Saving

This tutorial extends the Angular 21 / jadice web toolkit 7 baseline and demonstrates how to:
- load annotations from an external URI
- save annotations via a custom server-side save handler
- use a simple storage server with basic auth for local testing

## What is implemented

- Client-side default source includes:
  - document URI: `http://localhost:3000/PDFUA.pdf`
  - annotation URI: `http://localhost:3000/test93.xml`
  - repository seed file: `tutorial-002/test-server-basic-auth/public/test93.xml`
- Save action is available in both:
  - top toolbar
  - application menu
- Save operation sends a `SAVE_ANNOS` conversation with:
  - `saveStreamId: "test93.xml"`
  - `saveAnnotationsHandlerId: "SaveJadiceAnnotationsHandler"`
  - `annoFormat: "JADICE"`
- Server-side save handler posts raw binary annotation data to:
  - `http://localhost:3000/test93.xml` (without `?upload`)
- Server-side `SaveJadiceAnnotationsHandler` is annotated with `@Component`; jadice web toolkit 7 auto-registers it as save handler (no manual registration needed).
- Server save endpoint and auth are configured in:
  - `tutorial-002/server/src/main/resources/application.yml`
- Render controls (page/document rotation, gradation curve) are **restored on load**, fully server-side:
  - a custom HTTP data provider fetches a render-controls JSON from the storage server and attaches it to the document before it is read
  - default source annotation URI has a companion file `http://localhost:3000/test93.rendercontrols.json`
  - repository seed file: `tutorial-002/test-server-basic-auth/public/test93.rendercontrols.json` (rotates only the first page 90°)
  - client rotations are **saved** together with the annotations (see "Save render controls" below)
  - See the section "Restore render controls on load" below.

## Run locally

1. Start the demo storage server:
```bash
cd tutorial-002/test-server-basic-auth
npm i
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

The credentials (`user1` / `test`) match what the Spring Boot backend has in
`tutorial-002/server/src/main/resources/application.yml` under the save-handler config,
so saving annotations from the client also works.

2. Start the Spring Boot backend (`tutorial-002/server`) using main class:
`org.jadice.jwv.tutorial.JadiceWebViewerApplication002`

3. Start the Angular client:
```bash
cd tutorial-002/client
npm i
npm start
```

4. Open `http://localhost:4200`.

## Restore render controls on load

Render controls (rotation, gradation curve) are **client-side view state**. The jadice web toolkit
transports them through a single document property, `serializedRenderControls`, holding a JSON
string produced by the toolkit's built-in serializer
(`com.levigo.jadice.web.client.rendercontrols.RenderControlsJsonSerializer`). On load, the client
reads that property when the document is installed into the viewer and applies the settings. There
is no need to implement any serialization ourselves.

This tutorial restores render controls **entirely server-side**, with no client changes:

1. `RenderControlsHttpSchemeDocumentDataProvider` extends the built-in
   `HttpSchemeDocumentDataProvider`. In `read(...)` it fetches the render-controls JSON from the
   configured URL and calls `RenderControlsUtils.attach(reader.getDocument(), json)` **before**
   `super.read(...)` reads the document. Attaching before the read is mandatory.
2. `RenderControlsHttpSchemeDocumentDataProviderFactory` registers that provider for the `http` and
   `https` schemes.
3. The built-in provider is disabled via `webtoolkit.uriProviderHttpEnabled: false` so our provider
   is the single (deterministic) provider for those schemes. That flag only gates the built-in
   factory's registration; HTTP loading itself is provided by our subclass.
4. The JSON is fetched through the inherited, authentication-aware HTTP client, so the storage
   server credentials from `webtoolkit.ddp.http.authentication` are reused.

Configuration (`application.yml`):

```yaml
render-controls:
  load:
    enabled: true
    uri: http://localhost:3000/test93.rendercontrols.json
```

A missing render-controls file (e.g. HTTP 404) is ignored and never breaks document loading.

### Scope of what is restored

The toolkit's default serialization format covers **rotation** and the **gradation curve** only.
Zoom, device resolution and affine transform exist in the format but are excluded by the default
filter; document-layer visibility, annotation visibility, image filter type and clipping are not
part of this mechanism at all. The seed file rotates only the first page 90°
(`"rotation": "ROT_090"` under a `page0` control kit). Each entry in `controlsKits` is named either
`document` (applies to the whole document) or `page<index>` (applies to a single 0-based page);
page kits take precedence over the document kit. Valid rotation values are `ROT_000`, `ROT_090`,
`ROT_180`, `ROT_270`.

### Verify render-controls restore

1. Ensure the storage server serves `test93.rendercontrols.json` (it ships in the repo).
2. Start the storage server, the backend and the client (see "Run locally").
3. Open `http://localhost:4200`. The document appears rotated 90°, because the seeded render
   controls are attached on load.
4. To confirm the mechanism, delete/rename `test93.rendercontrols.json` on the storage server and
   reload: the document loads unrotated.

## Save render controls

Render controls values live in the browser, so they only reach the server if the client sends
them. This is achieved without any custom serialization:

1. `app.component.ts` `saveAnnotations()` builds the snapshot via `getTransferableDocument()`
   (instead of `getDocument()`). With `useAutomaticRenderControls` enabled (the toolkit default),
   this auto-attaches the current render controls as the `serializedRenderControls` document
   property, which travels in the snapshot. This works in the rendered (GWT) viewer, not in
   accessible mode.
2. `SaveJadiceAnnotationsHandler` reads `document.getProperties().get("serializedRenderControls")`
   and POSTs it to the companion file derived from the annotation stream id
   (`test93.xml` to `test93.rendercontrols.json`) — the same file the load path restores from.

So a single click on "Save annotations" (toolbar or menu) stores both the annotations and the
current rotations/gradation. No extra button and no client-side serialization code are required.

### Verify save + restore round-trip

1. Start the storage server, backend and client (see "Run locally").
2. Rotate a page in the viewer.
3. Click "Save annotations" (toolbar or menu).
4. Reload the browser. The rotation is restored from `test93.rendercontrols.json`.

## Reset Demo Files

Saving annotations updates `tutorial-002/test-server-basic-auth/public/test93.xml`.
To reset the demo files back to the repository seed versions:

```bash
git restore tutorial-002/test-server-basic-auth/public/test93.xml
git restore tutorial-002/test-server-basic-auth/public/test93.rendercontrols.json
```

## Verify annotation persistence

1. Open the viewer document.
2. Add or edit an annotation.
3. Click Save (toolbar or menu).
4. Reload the browser page.
5. Confirm the annotation is loaded again from `test93.xml`.

## Key files

- Client wiring: `tutorial-002/client/src/root/app.component.ts`
- Annotation panel template: `tutorial-002/client/src/root/app.component.html`
- Save handler implementation (auto-registered via `@Component`): `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/annotation/SaveJadiceAnnotationsHandler.java`
- Post-bootstrap configuration (redaction types): `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/JadiceWebViewerApplicationGSConfig.java`
- Render-controls restore on load:
  - `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/rendercontrols/RenderControlsHttpSchemeDocumentDataProvider.java`
  - `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/rendercontrols/RenderControlsHttpSchemeDocumentDataProviderFactory.java`
  - `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/rendercontrols/RenderControlsLoadConfiguration.java`
  - Seed file: `tutorial-002/test-server-basic-auth/public/test93.rendercontrols.json`
- Server properties: `tutorial-002/server/src/main/resources/application.yml`
- Demo storage server: `tutorial-002/test-server-basic-auth/static-server.js`
