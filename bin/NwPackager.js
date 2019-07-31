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

      // Set the default package options
      const packageOptions = {
        // %p% is a special symbol that gets replaced with the os name and architecture
        "package_name": "app-%p%",
        "linux": {
          ".desktop_file": true,
          "directory": false,
          "deb": true,
          "rpm": false,
          "tar": false,
          "tar.gz": true,
          "zip": false,
        },
        "mac": {
          "directory": false,
          "pkg": true,
          "tar": false,
          "tar.gz": false,
          "zip": true,
        },
        "windows": {
          "directory": false,
          "inno_setup": true,
          "tar": false,
          "tar.gz": false,
          "zip": true,
        },
      };

      // Combine defaults with user's options
      Object.assign(buildOptions, userBuildOptions);
      this.NwBuilder = new NwBuilder(buildOptions);
      this.buildOptions = buildOptions;
      Object.assign(packageOptions, userPackageOptions);
      this.packageOptions = packageOptions;
    }

    /**
     * Builds and packages an application
     * @return {Promise}
     */
    build() {
      return new Promise((resolve, reject) => {
        this.NwBuilder.build().then(function () {
          resolve();
        }).catch(function (error) {
          reject(error);
        });
      });
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
