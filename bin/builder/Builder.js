(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");
  const process = require("process");
  const {promisify} = require("util");
  const exec = promisify(require("child_process").exec);

  const archiver = require("archiver");
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
      // The directory to store the app files
      this.tempAppFilesDir = "";

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

      // Copy NW.js files to the app output dir
      console.log(`[Builder] Copy NW.js binary dir to ${appOutputDir}`);
      await promisify(copy)(nwDirPath, appOutputDir);

      // Make sure the app files have a package.json
      this.options.files.push("package.json");

      // Copy app files to temp dir
      this.tempAppFilesDir = Builder.createTempDir(this.options.files);
      console.log(`[Builder] Created temp app files dir ${this.tempAppFilesDir}`);

      // Run npm install --production
      console.log("[Builder] Running npm install --production");
      let child = await exec("npm install --production", { cwd: this.tempAppFilesDir });
      console.log(child.stdout);
      console.error(child.stderr);

      // Zip temp dir as app.nw
      const appFilesArchiveName = (this.platform === "osx" ? "app.nw" : "package.nw");
      const appFilesArchivePath = path.join(appOutputDir, appFilesArchiveName);
      console.log(`[Builder] Zip app files as ${appFilesArchiveName}`);

      let self = this;
      let zipAppFiles = await new Promise(function (resolve, reject) {
        // Create a file to stream archive data to
        const output = fs.createWriteStream(appFilesArchivePath);
        const archive = archiver("zip", {});

        // Append files from a sub-directory, putting its contents at the root of archive
        archive.pipe(output);
        archive.directory(self.tempAppFilesDir, "/");
        archive.finalize();

        output.on("close", function () {
          resolve(archive);
        });

        archive.on("error", function (err) {
          reject(err);
        });
      });

      // Append package.nw to the binary
      let appendCmd;
      if (this.platform === "win") {
        appendCmd = `copy /b nw.exe+${appFilesArchiveName} ${this.options.appPackageName}.exe`;
      } else if (this.platform === "linux") {
        appendCmd = `cat nw ${appFilesArchiveName} > ${this.options.appPackageName} && chmod +x ${this.options.appPackageName}`;
      }

      // Windows and Linux
      if (appendCmd) {
        console.log(`[Builder] Combine app files with nw binary`);

        let child = await exec(appendCmd, { cwd: appOutputDir });
        console.log(child.stdout);
        console.error(child.stderr);

        // Remove unappended binary and app files zip
        await promisify(rimraf)(appFilesArchivePath);
        const nwBinaryPath = path.join(appOutputDir, (this.platform == "win" ? "nw.exe" : "nw"));
        await promisify(rimraf)(nwBinaryPath);

      // macOS
      } else {
        console.log(`[Builder] Combine app files with nw.app`);

        // Rename the .app package
        const osxAppPath = path.join(appOutputDir, "nw.app");
        fs.renameSync(osxAppPath, `${this.options.appPackageName}.app`);

        // Move zip of app files inside of the .app
        fs.renameSync(appFilesArchivePath, path.join(osxAppPath, "Contents", "Resources", appFilesArchiveName));
      }

      // Delete temporary directory
      console.log(`[Builder] Removed temp app files dir ${this.tempAppFilesDir}`);
      await promisify(rimraf)(this.tempAppFilesDir);

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
