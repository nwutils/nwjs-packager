(function () {
  "use strict";
  const os = require("os");
  const path = require("path");
  const process = require("process");

  const Downloader = require("./Downloader");

  /**
   * Class for combining an app with a NW.js binary.
   */
  class Builder {
    /**
     * 
     * @param {Object} userOptions An hash of options for the build
     * @param {String} platform The operating system to build for (default is the current platform)
     * @param {String} architecture The architecture to build for (x64 or ia32)
     */
    constructor(userOptions = {}, platform = null, architecture = null) {
      this.options = userOptions;

      // The operating system platform to build for
      // (possible values darwin, linux or win32)
      this.platform = (platform ? platform : Builder.nodeToNwjsPlatform(process.platform));
      // The operating system architecture (possible values "x64" or "ia32")
      this.architecture = (architecture ? architecture : (process.arch === "x64" ? "x64" : "ia32"));

      this.downloader = new Downloader(
          this.options.nwVersion,
          this.options.nwFlavor,
          this.platform,
          this.architecture,
          this.options.cacheDir,
      );
    }

    /**
     * Downloads an NW.js binary, runs npm install --production on the app files and
     * appends the app the binary.
     */
    async package() {
      console.log(`[Builder] Start ${this.platform}-${this.architecture} package`);
      // Unzip the nw archive to the output directory
      let nwArchivePath = await this.downloader.get();
      // unzip(nwArchivePath, path.join(this.outputDir, this.appOutputName));

      // Copy app files to temp dir

      // Run npm install --production

      // Zip temp dir and rename to app.nw

      // Append app.nw into nw archive
      return;
    }

    /**
     * Runs extra steps in the build process that are OS specific.
     */
    async packageExtras() {
      this._addIcon();
      this._renameOsxFiles();
      return;
    }

    /**
     * Generate the selected outputs for the build.
     */
    async generateOutputs() {
      let outputs = this.options.builds[this.options.platform];
      console.log(outputs);
      return;
    }

    /**
     * Adds icons to macOS of Windows packages.
     */
    _addIcon() {
      if (this.options.platform === "osx") {

      } else if (this.options.platform === "win") {

      }
      return;
    }

    /**
     * On macOS, a number of files and plist entries need renaming from NW.js to the app's name.
     */
    _renameOsxFiles() {
      return;
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
