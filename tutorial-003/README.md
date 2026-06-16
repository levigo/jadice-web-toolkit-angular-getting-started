# Tutorial 003: Annotation Loading and Saving (Built-in HTTP Handler)

This tutorial demonstrates annotation loading and saving using the built-in
`HttpSaveJadiceAnnotationsHandler` from `webtoolkit-ng-server`.

If you need a fully custom save implementation, use `tutorial-002`.

## What is implemented

- Client-side default source includes:
  - document URI: `http://localhost:3000/PDFUA.pdf`
  - annotation URI: `http://localhost:3000/test103.xml`
  - repository seed file: `tutorial-003/test-server-basic-auth/public/test103.xml`
- Save action is available in both:
  - top toolbar
  - application menu
- Save operation sends a `SAVE_ANNOS` conversation with:
  - `saveStreamId: "test103.xml"`
  - `saveAnnotationsHandlerId: "HttpSaveJadiceAnnotationsHandler"`
  - `annoFormat: "JADICE"`
- Server-side save behavior is configured via:
  - `webtoolkit.annotation.save.http.*` in `application.yml`
  - `url-template: "{baseUrl}/{streamId}"` (raw upload without `?upload`)

## Run locally

1. Start the demo storage server:
```bash
cd tutorial-003/test-server-basic-auth
npm i
node static-server.js --port 3000 --dir ./public --auth --username user1 --password test
```

The credentials (`user1` / `test`) match what the Spring Boot backend has in
`tutorial-003/server/src/main/resources/application.yml` under
`webtoolkit.annotation.save.http.*`, so saving annotations from the client also works.

2. Start the Spring Boot backend (`tutorial-003/server`) using main class:
`org.jadice.jwv.tutorial.JadiceWebViewerApplication003`

3. Start the Angular client:
```bash
cd tutorial-003/client
npm i
npm start
```

4. Open `http://localhost:4200`.

## Reset demo annotation file

Saving annotations updates `tutorial-003/test-server-basic-auth/public/test103.xml`.
To reset it back to the repository seed version:

```bash
git restore tutorial-003/test-server-basic-auth/public/test103.xml
```

## Verify annotation persistence

1. Open the viewer document.
2. Add or edit an annotation.
3. Click Save (toolbar or menu).
4. Reload the browser page.
5. Confirm the annotation is loaded again from `test103.xml`.

## Key files

- Client wiring: `tutorial-003/client/src/root/app.component.ts`
- Server properties: `tutorial-003/server/src/main/resources/application.yml`
- Spring Boot app entrypoint: `tutorial-003/server/src/main/java/org/jadice/jwv/tutorial/JadiceWebViewerApplication003.java`
- Demo storage server: `tutorial-003/test-server-basic-auth/static-server.js`
