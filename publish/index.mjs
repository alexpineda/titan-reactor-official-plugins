import path, {dirname} from "path";
import search from "libnpmsearch";
import loadFile from "./load-file.mjs";
import semver from "semver";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import {tryLoadUtf8} from "./try-load.mjs"

const SEARCH_KEYWORDS = "keywords:titan-reactor-plugin";
const SEARCH_OFFICIAL = "@titan-reactor-plugins";
const LIMIT = 1000;

const officialPackages = await search(SEARCH_OFFICIAL, {
  limit: LIMIT,
});

const publicPackages = (
  await search(SEARCH_KEYWORDS, {
    limit: LIMIT,
  })
).filter((pkg) => !officialPackages.some((p) => p.name === pkg.name));

const results = [...officialPackages, ...publicPackages];

const __dirname = dirname(fileURLToPath(import.meta.url));

const folders = await loadFile(path.resolve(__dirname, "../plugins"));

const outOfDate = [];
const unpublished = [];
const oldSdk = [];

for (const folder of folders) {
  if (!folder.isFolder) {
    continue;
  }
  const packageJSON = await tryLoadUtf8(
    path.join(folder.path, "package.json"),
    "json"
  );
  if (packageJSON === null) {
    continue;
  }

  if (packageJSON?.peerDependencies?.["titan-reactor-api"] !== "2.0.0") {
    oldSdk.push(packageJSON.name);
  }

  const remotePackage = results.find((p) => p.name === packageJSON.name);
  if (remotePackage === undefined) {
    unpublished.push(packageJSON.name);
  } else if (semver.gt(packageJSON.version, remotePackage.version)) {
    outOfDate.push(
      `${chalk.white.bgRed(`${packageJSON.name}-${packageJSON.version}`)} ${chalk.red(remotePackage.version)}`
      );
  }
}

outOfDate.length && console.log(chalk.white.bgRed(`Out of date packages:`));
for (const name of outOfDate) {
  console.log(name);
}

unpublished.length && console.log(chalk.white.bgYellow(`Unpublished packages:`));
for (const name of unpublished) {
  console.log(chalk.white.bgYellow(`${name}`));
}

oldSdk.length && console.log(chalk.white.bgGreen(`Old SDK packages:`));
for (const name of oldSdk) {
  console.log(chalk.white.bgGreen(`${name}`));
}
