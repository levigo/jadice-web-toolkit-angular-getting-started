import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./root/app.module";
import {environment} from "./environments/environment";
import {preloadPrecursor} from "@levigo/webtoolkit-ng-client";

if (environment.production) {
    enableProdMode();
}

environment.production = true
// Change this mechanism in your production code
const backendServerUrl = "http://localhost:8080";

const serverURL = environment.production ? backendServerUrl : window.location.origin + "/api";

// This part is absolutely necessary as it will bootstrap the angular-GWT wrapper called "precursor"
// As of the start of jwv 6.x, it is planned to reduce that layer step by step so in the end we
// might end up without any GWT code, but for a start we still need some of the old jadice web toolkit 5 part.
preloadPrecursor({serverURL}).then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
        .catch(err => console.error(err));
});
