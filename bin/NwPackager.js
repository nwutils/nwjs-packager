(function () {
  "use strict";
  const CreatePackage = require("./CreatePackage");
  const NwBuilder = require("nw-builder");
  const path = require("path");
  const PreActions = require("./PreActions");

  /**
   * Class for running NwPackager instances
   */
  class NwPackager {
    /**
     * Creates a new NwPackager instance
     * @param {Object} buildOptions The NwBuilder options to use.
     * @param {Object} userPackageOptions The packaging options to use.
     */
    constructor(buildOptions = {}, userPackageOptions = {}) {
      // Set additional default nw-builder options
      if (!buildOptions.files) {
        // Take all files in current directory
        buildOptions.files = [
          path.join(process.cwd(), "**"),
          `!${buildOptions.buildDir ? buildOptions.buildDir : path.join(process.cwd(), "build", "**")}`,
          `!${buildOptions.cacheDir ? buildOptions.cacheDir : path.join(process.cwd(), "cache", "**")}`,
        ];
      }
      if (!buildOptions.platforms || buildOptions.platforms[0] === "") {
        // Build current OS x32 and x64 variants
        buildOptions.platforms = NwPackager.getCurSuitablePlatforms();
      }

      // Set buildType to "default" regardless of user preference as nwjs-packager controls the package name
      buildOptions.buildType = "default";

      this.NwBuilder = new NwBuilder(buildOptions);
      this.NwBuilder.on("log", console.log);

      // Set the default package options
      const packageOptions = {
        // %p% is a special symbol that gets replaced with the os name and architecture
        "package_name": "%a%-%v%-%p%",
        "linux": {
          "pre": {
            "desktop_file": true,
          },
          "packages": {
            "deb": true,
            "rpm": false,
            "tar": false,
            "tar.gz": true,
            "zip": false,
          },
        },
        "osx": {
          "packages": {
            "pkg": true,
            "tar": false,
            "tar.gz": false,
            "zip": true,
          },
        },
        "win": {
          "packages": {
            "inno_setup": false,
            "tar": false,
            "tar.gz": false,
            "zip": true,
          },
        },
      };
      // Combine default and user package options
      Object.assign(packageOptions, userPackageOptions);
      this.packageOptions = packageOptions;
    }

    /**
     * Builds an application with nw-builder
     * @return {Promise}
     */
    build() {
      const self = this;
      return new Promise((resolve, reject) => {
        // Build app using nw-builder
        console.log("Building app with nw-builder...");
        self.NwBuilder.build().then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        })
      });
    }

    /**
     * Packages an application.
     * @return {Promise}
     */
    package() {
      const self = this;
      return new Promise((resolve, reject) => {
        console.log("Packaging app...");
        // The list of promises to resolve
        const promisesList = [];

        // Loop through each platform
        self.NwBuilder.options.platforms.forEach(function (platform) {
          // Platform with architecture
          const curOs = platform.replace(/[0-9]/g, "");
          // The folder containing the build
          const inputDir = path.join(self.NwBuilder.options.buildDir, self.NwBuilder.options.appName, platform);

          // *** Add each pre-packaging action promise ***
          if ("pre" in self.packageOptions[curOs]) {
            for (const [preType, isEnabled] of Object.entries(self.packageOptions[curOs].pre)) {
              if (isEnabled) {
                promisesList.push(PreActions.run(preType, inputDir, self));
              }
            }
          }

          // *** Add each packaging promise ***
          for (const [packageType, isEnabled] of Object.entries(self.packageOptions[curOs].packages)) {
            if (isEnabled) {
              // The folder to output the package to
              const outputDir = self.NwBuilder.options.buildDir;
              // The name to give the package
              const packageName = self.renderPackageTemplates(platform);
              promisesList.push(CreatePackage.make(packageType, inputDir, outputDir, packageName, self));
            }
          }
        });

        // *** Resolve all of the promises ***
        Promise.all(promisesList).then(function () {
          resolve();
        }).catch(function (error) {
          reject(error);
        });
      });
    }

    /**
     * Converts templates from package_name to output string..
     * @param {String} platform The name of the current platform.
     * @return {String} The converted package name string.
     */
    renderPackageTemplates(platform) {
      let output = this.packageOptions.package_name;
      output = output.replace("%a%", this.NwBuilder.options.appName);
      output = output.replace("%v%", this.NwBuilder.options.appVersion);
      output = output.replace("%p%", platform);
      return output;
    }

    /**
     * Returns an array of NW.js platforms suitable for the current OS
     * @return {Array} The list of suitable platforms (eg ["win32","win64"])
     */
    static getCurSuitablePlatforms() {
      switch (process.platform) {
        case "darwin":
          return [osx64];
        case "linux":
          return ["linux32", "linux64"];
        case "win32":
          return ["win32", "win64"];
        default:
          console.log("!Error: platform not supported by NW.js.");
          return [];
      }
    }
  }
  module.exports = NwPackager;
})();
