(function () {
  "use strict";
  const NwBuilder = require("nw-builder");
  const path = require("path");

  /**
   * Class for running NwPackager instances
   */
  class NwPackager {
    /**
     * Creates a new NwPackager instance
     * @param {Object} userBuildOptions The NwBuilder options to use.
     * @param {Object} userPackageOptions The packaging options to use.
     */
    constructor(userBuildOptions = {}, userPackageOptions = {}) {
      // Set additional default nw-builder options
      const buildOptions = {};
      buildOptions.files = path.join(process.cwd(), "**");
      buildOptions.platforms = NwPackager.getCurSuitablePlatforms();
      // Combine default and user nw-builder options
      Object.assign(buildOptions, userBuildOptions);

      // Set buildType to "default" regardless of user preference for consistency
      buildOptions.buildType = "default";

      this.NwBuilder = new NwBuilder(buildOptions);
      this.NwBuilder.on("log", console.log);

      // Set the default package options
      const packageOptions = {
        // %p% is a special symbol that gets replaced with the os name and architecture
        "appName": "app",
        "appVersion": "1.0.0",
        "package_name": "app-%p%",
        "linux": {
          "pre": {
            "desktop_file": true,
          },
          "packages": {
            "directory": false,
            "deb": true,
            "rpm": false,
            "tar": false,
            "tar.gz": true,
            "zip": false,
          },
        },
        "mac": {
          "packages": {
            "directory": false,
            "pkg": true,
            "tar": false,
            "tar.gz": false,
            "zip": true,
          },
        },
        "windows": {
          "packages": {
            "directory": false,
            "inno_setup": true,
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
     * Builds and packages an application
     * @return {Promise}
     */
    build() {
      let self = this;
      return new Promise((resolve, reject) => {
        // The list of promises to resolve
        const promisesList = [];

        // Build app using nw-builder
        console.log("Building app with nw-builder...");
        promisesList.push(self.NwBuilder.build());

        // Loop through each platform
        self.NwBuilder.options.platforms.forEach(function (platform) {
          // The folder containing the build
          const BUILD_DIR = path.join(self.NwBuilder.options.buildDir, self.packageOptions.appName, platform);

          // *** Add each pre-packaging action promise ***
          // Add .desktop file
          if (platform === "linux32" || platform === "linux64" && self.packageOptions.linux.pre.desktop_file) {
            promisesList.push(self._pre(BUILD_DIR, desktop_file));
          }

          // *** Add each packaging promise ***
          // todo
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
     * Performs an action on a build before packaging.
     * @param {String} buildDir The directory of the build.
     * @param {String} preType The action to perform (eg add .desktop file for Linux).
     * @return {Promise}
     */
    _pre(buildDir, preType) {
      return new Promise((resolve, reject) => {
        try {
          switch (preType) {
            case "desktop_file":
              PreActions.makeDesktopFile(this, buildDir).then(() => {
                resolve();
              });
              break;
            default:
              throw Error("Invalid pre action type entered");
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    /**
     * Makes a package of a given type from a directory
     * @param {*} buildDir The directory of the build.
     * @param {*} packageType The type of package to create.
     */
    _createPackage(buildDir, packageType) {
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
