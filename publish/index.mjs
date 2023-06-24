import path, {dirname} from "path";
import search from "libnpmsearch";
import loadFile from "./load-file.mjs";
import semver from "semver";
import chalk from "chalk";
import inquirer from "inquirer";
import { fileURLToPath } from 'url';
import {tryLoadUtf8} from "./try-load.mjs"
import {promisify} from 'util';
import {exec as execCallback} from "child_process";

const exec = promisify(execCallback);

const SEARCH_KEYWORDS = "keywords:titan-reactor-plugin";
const SEARCH_OFFICIAL = "@titan-reactor-plugins";
const LIMIT = 1000;

const logPackages = (label, color, packages) => {
  if (packages.length) {
    console.log(chalk[color].bgBlack(label));
    packages.forEach((pkg) => console.log(pkg.label));
  }
};

const main = async () => {
  const officialPackages = await search(SEARCH_OFFICIAL, { limit: LIMIT, });
  const publicPackages = (
    await search(SEARCH_KEYWORDS, { limit: LIMIT, })
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
      oldSdk.push({package: packageJSON, folder, label: `${packageJSON.name} - old-sdk` });
    }

    const remotePackage = results.find((p) => p.name === packageJSON.name);
    if (remotePackage === undefined) {
      unpublished.push({package: packageJSON, folder, label: `${packageJSON.name} - unpublished`});
    } else if (semver.gt(packageJSON.version, remotePackage.version)) {
      outOfDate.push({
        package: packageJSON,
        folder,
        label: `${chalk.white.bgBlack(packageJSON.name)}-${chalk.green(packageJSON.version)} - published version: ${chalk.red(remotePackage.version)}`
      });
    }
  }

  logPackages('Out of date packages:', 'white', outOfDate);
  logPackages('Unpublished packages:', 'yellow', unpublished);
  logPackages('Old SDK packages:', 'green', oldSdk);

  const allPlugins = [...outOfDate, ...unpublished];

  try {
    const {plugin: pluginName} = await inquirer.prompt([
      {
        type: "list",
        name: "plugin",
        message: "Select a plugin to publish",
        choices: allPlugins.map((plugin) => plugin.package.name)
      }
    ]);
    
    const plugin = allPlugins.find((p) => p.package.name === pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    const {error, stdout, stderr} = await exec(`npm publish ${plugin.folder.path} --access public`);
    
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    
    if (stderr) {
        console.log(stderr);
        return;
    }
    
    console.log(stdout);
  } catch (error) {
    console.error(error);
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  }
}

main();
