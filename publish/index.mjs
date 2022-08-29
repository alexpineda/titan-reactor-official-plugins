import path, {dirname} from "path";
import search from "libnpmsearch";
import loadFile from "./load-file.mjs";
import semver from "semver";
import chalk from "chalk";
import inquirer from "inquirer";
import { fileURLToPath } from 'url';
import {tryLoadUtf8} from "./try-load.mjs"
import {exec} from "child_process";


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

outOfDate.length && console.log(chalk.white.bgRed(`Out of date packages:`));
for (const plugin of outOfDate) {
  console.log(plugin.label);
}

unpublished.length && console.log(chalk.white.bgYellow(`Unpublished packages:`));
for (const plugin of unpublished) {
  console.log(plugin.label);
}

oldSdk.length && console.log(chalk.white.bgGreen(`Old SDK packages:`));
for (const plugin of oldSdk) {
  console.log(plugin.label);
}

const allPlugins = [...outOfDate, ...unpublished];

// type: (String) Type of the prompt. Defaults: input - Possible values: input, number, confirm, list, rawlist, expand, checkbox, password, editor
// name: (String) The name to use when storing the answer in the answers hash. If the name contains periods, it will define a path in the answers hash.
// message: (String|Function) The question to print. If defined as a function, the first parameter will be the current inquirer session answers. Defaults to the value of name (followed by a colon).
// default: (String|Number|Boolean|Array|Function) Default value(s) to use if nothing is entered, or a function that returns the default value(s). If defined as a function, the first parameter will be the current inquirer session answers.
// choices: (Array|Function) Choices array or a function returning a choices array. If defined as a function, the first parameter will be the current inquirer session answers. Array values can be simple numbers, strings, or objects containing a name (to display in list), a value (to save in the answers hash), and a short (to display after selection) properties. The choices array can also contain a Separator.
// validate: (Function) Receive the user input and answers hash. Should return true if the value is valid, and an error message (String) otherwise. If false is returned, a default error message is provided.
// filter: (Function) Receive the user input and answers hash. Returns the filtered value to be used inside the program. The value returned will be added to the Answers hash.
// transformer: (Function) Receive the user input, answers hash and option flags, and return a transformed value to display to the user. The transformation only impacts what is shown while editing. It does not modify the answers hash.
// when: (Function, Boolean) Receive the current user answers hash and should return true or false depending on whether or not this question should be asked. The value can also be a simple boolean.
// pageSize: (Number) Change the number of lines that will be rendered when using list, rawList, expand or checkbox.
// prefix: (String) Change the default prefix message.
// suffix: (String) Change the default suffix message.
// askAnswered: (Boolean) Force to prompt the question if the answer already exists.
// loop: (Boolean) Enable list looping. Defaults: true
// waitUserInput: (Boolean) Flag to enable/disable wait for user input before opening system editor - Defaults: true

inquirer
  .prompt([
    {
      type: "list",
      name: "plugin",
      message: "Select a plugin to publish",
      choices: allPlugins.map((plugin) => plugin.package.name)
    }
    /* Pass your questions in here */
  ])
  .then((answers) => {
    // Use user feedback for... whatever!!
    const plugin = allPlugins.find((p) => p.package.name === answers.plugin);
    if (plugin === undefined) {
      console.error(`Plugin ${answers.plugin} not found`);
      return;
    }
    exec(`npm publish ${plugin.folder.path} --access public`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(stderr);
            return;
        }
        console.log(stdout);
    });

  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });