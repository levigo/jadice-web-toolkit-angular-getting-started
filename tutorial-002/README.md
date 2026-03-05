# Tutorial 002: Annotation Loading and Saving

This tutorial extends the Angular 20 baseline and demonstrates how to:
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
- Server registers `SaveJadiceAnnotationsHandler` in:
  - `JadiceWebViewerApplicationGSConfig`
- Server save endpoint and auth are configured in:
  - `tutorial-002/server/src/main/resources/application.yml`

## Run locally

1. Start the demo storage server:
```bash
cd tutorial-002/test-server-basic-auth
npm i
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

2. Start the Spring Boot backend (`tutorial-002/server`) using main class:
`org.jadice.jwv.tutorial.JadiceWebViewerApplication002`

3. Start the Angular client:
```bash
cd tutorial-002/client
npm i
npm start
```

4. Open `http://localhost:4200`.

## Reset Demo Annotation File

Saving annotations updates `tutorial-002/test-server-basic-auth/public/test93.xml`.
To reset it back to the repository seed version:

```bash
git restore tutorial-002/test-server-basic-auth/public/test93.xml
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
- Save handler registration: `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/JadiceWebViewerApplicationGSConfig.java`
- Save handler implementation: `tutorial-002/server/src/main/java/org/jadice/jwv/tutorial/annotation/SaveJadiceAnnotationsHandler.java`
- Server properties: `tutorial-002/server/src/main/resources/application.yml`
- Demo storage server: `tutorial-002/test-server-basic-auth/static-server.js`
