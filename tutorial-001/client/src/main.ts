import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./root/app.module";
import {environment} from "./environments/environment";
import {preloadPrecursor} from "@levigo/webtoolkit-ng-client";
import {Logger} from "@levigo/jadice-common-components";

if (environment.production) {
    enableProdMode();
}

environment.production = true
// Change this mechanism in your production code
const backendServerUrl = "http://localhost:8080";

const serverURL = environment.production ? backendServerUrl : window.location.origin + "/api";

// Logger configuration
(window as any)["jwv"] = {
  logLevel: "INFO",
  logServerLevel: "ERROR",
  logLevelSettings: {
    error: {
      withStack: false, // Include stack trace
      withStackDepth: -1, // Include full stack trace
      withServerStack: true, // Include server stack trace
      withServerStackDepth: -1 // Include full server stack trace
    },
    warn: {
      withStack: false,
      withStackDepth: -1,
      withServerStack: false,
      withServerStackDepth: -1
    },
    info: {
      withStack: false, // Include stack trace
      withStackDepth: 2, // Include stack trace with depth 2
      withServerStack: false, // Do not include server stack trace
      withServerStackDepth: 5
    },
    debug: { // default off
      withStack: false,
      withStackDepth: 1,
      withServerStack: false,
      withServerStackDepth: 5
    }
  },
  /*"MyClassNameExample": { // optional class-specific configuration
    logLevel: "info",
    logServerLevel: "error",
    logLevelSettings: {
      error: { // optional per-level configuration
        withStack: true,
        withStackDepth: -1,
        withServerStack: true,
        withServerStackDepth: -1
      }
    }
  }*/
};

Logger.init().then(() => {
  console.log("Logger initialized");
  // This part is absolutely necessary as it will bootstrap the angular-GWT wrapper called "precursor"
  // As of the start of jwv 6.x, it is planned to reduce that layer step by step so in the end we
  // might end up without any GWT code, but for a start we still need some of the old jadice web toolkit 5 part.
  preloadPrecursor({serverURL}).then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });
});
