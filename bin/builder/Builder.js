(function () {
  "use strict";
  const os = require("os");
  const process = require("process");

  const Downloader = require("./Downloader");

  /**
   * Class for combining an app with a NW.js binary.
   */
  class Builder {
    /**
     * @param {Object} userOptions An hash of options for the build
     */
    constructor(userOptions = {}) {
      const defaultOptions = {
        // {String[]} The file to include in the output packages
        "files": [`${process.cwd()}/**`],
        // {String} Location to store downloaded NW.js binaries
        "cacheDir": `${os.homedir()}/.nwjs-packager/cache`,
        // {String} Location to store app files ready for packaging
        "tempDir": `${os.homedir()}/.nwjs-packager/temp`,
        // {String} Location to output packages to
        "outputDir": `${process.cwd()}/bin`,

        // {String} The operating system platform to build for
        // (possible values darwin, linux or win32)
        "platform": Builder.nodeToNwjsPlatform(process.platform),
        // {String} The operating system architecture (possible values "x64" or "ia32")
        "architecture": (process.arch === "x64" ? "x64" : "ia32"),

        // The version of NW.js to use
        "nwVersion": "stable",
        // The "flavor" of NW.js to use (possible values "normal" or "sdk")
        "nwFlavor": "normal",

        // The nerd name for the app to use in file names (ie there should be no spaces)
        "appPackageName": "my-app",
        // The version of the app
        "appVersion": "0.1.0",
        // The file name format of output packages. Can use the special symbols %a%, %v% %p%
        // which are replaced with the appPackageName appName, appVersion and NW.js platform (eg osx-x64) respectively
        "appOutputName": "%a%-%v%-%p%",
        // The nice name of the app to display to the user (ie there can be spaces)
        "appFriendlyName": "My App",
        // A path to a .icns file to use for generating the macOS icon
        "appMacIcon": null,
        // A path to an .ico file to use for generating the Windows icon
        "appWinIcon": null,
        // A short description of the app. Used in the macOS Info.plist and Windows fileVersion.
        "appDescription": "App generated using nwjs-packager.",
        // The copyright detail of the app. Used in the macOS Info.plist and Windows fileVersion.
        "appCopyright": `© ${new Date().getFullYear()} My App Developers`,

        // The outputs to generate
        // Possibles values are "deb", "rpm", "tar.gz", "zip", "pkg", "innoSetup" depending on the platform
        "outputs": []
      };
      // Combine default and user options
      this.options = Object.assign(defaultOptions, userOptions);

      this.downloader = new Downloader(
          this.options.nwVersion,
          this.options.nwFlavor,
          this.options.platform,
          this.options.architecture,
      );
    }

    /**
     * jo
     * @param {*} output thing
     * @return {Output} thing 
     */
    static initialiseOutput(output) {
      switch (output) {
        case "win32":
          return "win";
        case "darwin":
          return "osx";
        case "linux":
          return "linux";
        default:
          throw new Error(`${platform} is not a valid NW.js platform`);
      }
    }

    /**
     * Converts a platform string from those used by Node to NW.js ones.
     * @param {String} platform The name of the node platform to convert from.
     * @return {String} The name of the corelating NW.js platform.
     */
    static nodeToNwjsPlatform(platform) {
      switch (platform) {
        case "win32":
          return "win";
        case "darwin":
          return "osx";
        case "linux":
          return "linux";
        default:
          throw new Error(`${platform} is not a valid NW.js platform`);
      }
    }
  }

  module.exports = Builder;
})();
