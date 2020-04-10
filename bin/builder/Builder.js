(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");
  const process = require("process");
  const {promisify} = require("util");

  const glob = require("glob");
  const copy = require("recursive-copy");
  const mkdirp = require("mkdirp");
  const rimraf = require("rimraf");

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
      const nwDirPath = await this.downloader.get();
      const appOutputDir = path.join(this.options.outputDir, this._renderPackageName());

      // Remove existing output dir
      if (fs.existsSync(appOutputDir)) {
        await promisify(rimraf)(appOutputDir);
      }

      // Rename NW.js binary dir to the app output name
      console.log(`[Builder] Copy NW.js binary dir to ${appOutputDir}`);
      await promisify(copy)(nwDirPath, appOutputDir);

      // Copy app files to temp dir
      const tempAppFilesDir = Builder.createTempDir(this.options.files);

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
     * Adds icons to macOS and Windows packages.
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
     * Converts templates from package_name to output string.
     * @return {String} The package name converted.
     */
    _renderPackageName() {
      let output = this.options.appOutputName;
      output = output.replace(/%a%/g, this.options.appPackageName);
      output = output.replace(/%v%/g, this.options.appVersion);
      output = output.replace(/%p%/g, `${this.platform}-${this.architecture}`);
      return output;
    }

    /**
     * Creates a temporary directory for packaging and moves all of the files over
     * @param {String[]} files An array of files to copy
     * @return {String} The path of the temporary directory
     */
    static createTempDir(files) {
      if (files.length === 0) {
        throw new Error("No files were selected")
      }

      // Move all of the selected files into a temporary directory
      // https://gist.github.com/6174/6062387
      let tempUuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let tempDir = `${require('os').homedir()}/.nwjs-packager/temp/${tempUuid}`;

      // Loop through each selected glob and file
      files.forEach(function (file, i) {
        // Normalize the glob
        files[i] = path.normalize(file);

        // Move each file that matches the glob to the temp dir
        let matchedFiles = glob.sync(files[i], {});
        matchedFiles.forEach(function (filePath) {
          let relativePath = path.relative(process.cwd(), filePath);
          let newTempPath = `${tempDir}/${relativePath}`;

          // Make directories/files in temp location as appropriate
          if (fs.lstatSync(relativePath).isDirectory()) {
            mkdirp.sync(newTempPath);
          } else {
            mkdirp.sync(path.dirname(newTempPath));
            fs.copyFileSync(filePath, newTempPath);
          }
        });
      });

      return tempDir;
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
