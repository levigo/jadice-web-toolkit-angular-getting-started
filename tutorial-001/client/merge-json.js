const fs = require("fs");
const mergePatch = require("json-merge-patch");

function writeMerged(lang, files, path) {
    const merged = files.map(file => {
        const fileContents = fs.readFileSync(file + lang + ".json", "utf8");
        return JSON.parse(fileContents);
    }).reduce((a, b) => mergePatch.apply(a, b));
    fs.writeFileSync(path + lang + ".json", JSON.stringify(merged));
}

const filesLibrary = [
    "node_modules/@levigo/jadice-common-components/assets/i18n/",
    "node_modules/@levigo/ngx-webtoolkit/assets/i18n/",
    "node_modules/@levigo/webtoolkit-ng-client/assets/i18n/"
];

const filesDist = [
    "./src/assets/int/"
];

const combinedFiles = [...filesLibrary, ...filesDist];
const distDist = "./src/assets/i18n/";
writeMerged("de", combinedFiles, distDist);
writeMerged("en", combinedFiles, distDist);
writeMerged("fr", combinedFiles, distDist);
writeMerged("it", combinedFiles, distDist);
