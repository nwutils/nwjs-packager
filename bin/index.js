#!/usr/bin/env node
(async function () {
  "use strict";
  const os = require("os");
  const path = require("path");
  const process = require("process");
  const {promisify} = require("util");

  const argv = require("minimist")(process.argv.slice(2), {
    boolean: ["run"],
    alias: {"r": "run"},
  });
  const rimraf = require("rimraf");

  const Builder = require("./builder/Builder");
  const BuilderLinux = require("./builder/BuilderLinux");
  const BuilderOsx = require("./builder/BuilderOsx");
  const BuilderWin = require("./builder/BuilderWin");
  const Runner = require("./builder/Runner");
  const Utils = require("./Utils");

  try {
    console.log("Welcome to nwjs-packager!");
    init();
  } catch (err) {
    console.error(err);
  }

  /**
   * Initializes the application
   */
  async function init() {
    // Get user options from package.json
    const packageJSON = require(path.join(process.cwd(), "package.json"));
    if (!packageJSON["nwjs-packager"]) {
      throw new Error("App package.json is missing a \"nwjs-packager\" block");
    }

    const defaultOptions = {
      // An array of files to include in the output packages. Globs are accepted.
      "files": [],
      // Location to store downloaded NW.js binaries
      "cacheDir": path.join(os.homedir(), ".nwjs-packager", "cache"),
      // Location to store app files ready for packaging
      "tempDir": path.join(os.homedir(), ".nwjs-packager", "temp"),
      // Location to output packages to
      "outputDir": path.join(process.cwd(), "build"),

      // The version of NW.js to use (note versions should be in format "v0.44.5")
      // The strings "stable", "latest" or "lts" are also permitted
      "nwVersion": "stable",
      // The "flavor" of NW.js to use (possible values "normal" or "sdk")
      "nwFlavor": "normal",

      // The nerd name for the app to use in file names (ie there should be no spaces)
      "appPackageName": packageJSON["name"],
      // The version of the app
      "appVersion": packageJSON["version"],
      // The file name format of output packages. Can use the special symbols %a%, %v% %p%
      // which are replaced with the appPackageName appName, appVersion and NW.js platform (eg osx-x64) respectively
      "appOutputName": "%a%-%v%-%p%",
      // The nice name of the app to display to the user (ie there can be spaces)
      "appFriendlyName": Utils.titleCase(packageJSON["name"].replace(/[-_]/g, " ")),
      // A path to a .icns file to use for generating the macOS icon
      "appMacIcon": null,
      // A path to an .ico file to use for generating the Windows icon
      "appWinIcon": null,
      // A short description of the app. Used in the macOS Info.plist and Windows fileVersion.
      "appDescription": packageJSON["description"],
      // The copyright detail of the app. Used in the macOS Info.plist and Windows fileVersion.
      "appCopyright": `© ${new Date().getFullYear()} ${packageJSON["author"]}`,

      // The platforms and outputs to build for
      // Possibles values are "deb", "rpm", "tar.gz", "zip", "pkg", "innoSetup" depending on the platform
      "builds": {
        "linux": {"tar.gz": true, "rpm": true, "deb": true},
        "osx": {"zip": true, "pkg": true},
        "win": {"zip": true, "innoSetup": true},
      },
    };

    // Combine default and user options
    const options = Object.assign(defaultOptions, packageJSON["nwjs-packager"]);

    // Are we running the app or packaging it?
    if (argv.run) {
      const runner = new Runner(options);
      runner.run();
    } else {
      // Create a builder for the current OS
      const platform = Builder.nodeToNwjsPlatform(process.platform);
      let builder;
      switch (platform) {
        case "win":
          builder = new BuilderWin(options);
          break;
        case "osx":
          builder = new BuilderOsx(options);
          break;
        case "linux":
          builder = new BuilderLinux(options);
          break;
        default:
          throw new Error(`${platform} is not a valid NW.js platform`);
      }

      try {
        await builder.package();
        await builder.packageExtras();
        await builder.generateOutputs();

        // Delete temporary directory
        console.log(`[Builder] Removed temp app files dir ${builder.tempAppFilesDir}`);
        await promisify(rimraf)(builder.tempAppFilesDir);
      } catch (err) {
        console.error(err);

        // Delete temporary directory if error
        if (builder.tempAppFilesDir !== "") {
          console.log(`[Builder] Removed temp app files dir ${this.tempAppFilesDir}`);
          await promisify(rimraf)(builder.tempAppFilesDir);
        }
      }
    }
  }
})();
