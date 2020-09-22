(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");
  const process = require("process");
  const { promisify } = require("util");
  const exec = promisify(require("child_process").exec);

  const archiver = require("archiver");
  const glob = require("glob");
  const copy = require("recursive-copy");
  const mkdirp = require("mkdirp");
  const rimraf = require("rimraf");

  const Archive = require("../output/Archive");
  const Inno = require("../output/Inno");
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
     * @param {String} overrideNwFlavor The NW.js "flavor" (normal/sdk) to use. Overrides value in package.json
     *                                  Useful because we want "run" mode to always use sdk builds
     */
    constructor(userOptions = {}, platform = null, architecture = null, overrideNwFlavor = null) {
      this.options = userOptions;

      // The operating system platform to build for
      // (possible values darwin, linux or win32)
      this.platform = (platform ? platform : Builder.nodeToNwjsPlatform(process.platform));
      // The operating system architecture (possible values "x64" or "ia32")
      this.architecture = (architecture ? architecture : (process.arch === "x64" ? "x64" : "ia32"));
      // The directory to store the app files
      this.tempAppFilesDir = "";
      // The directory to create the build in
      this.appOutputDir = path.join(this.options.outputDir, this._renderPackageName());
      // The major version of the NW.js version of the build
      // NaN suggests "latest" or "stable" have been used
      this.nwjsMajorVersion = parseInt(this.options.nwVersion.split(".")[1]);

      this.downloader = new Downloader(
        this.options.nwVersion,
        (overrideNwFlavor ? overrideNwFlavor : this.options.nwFlavor),
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

      // Remove existing output dir
      if (fs.existsSync(this.appOutputDir)) {
        await promisify(rimraf)(this.appOutputDir);
      }

      // Copy NW.js files to the app output dir
      console.log(`[Builder] Copy NW.js binary dir to ${this.appOutputDir}`);
      await promisify(copy)(nwDirPath, this.appOutputDir);

      // Make sure the app files have a package.json
      this.options.files.push("package.json");

      // Copy app files to temp dir
      this.tempAppFilesDir = Builder.createTempDir(this.options.files);
      console.log(`[Builder] Created temp app files dir ${this.tempAppFilesDir}`);

      // Customise package.json
      await this._customisePackageJson();

      // Run npm install --production
      console.log("[Builder] Running npm install --production");
      let child = await exec("npm install --production", { cwd: this.tempAppFilesDir });
      console.log(child.stdout);
      console.error(child.stderr);

      // Zip temp dir as app.nw
      const appFilesArchiveName = (this.platform === "osx" ? "app.nw" : "package.nw");
      const appFilesArchivePath = path.join(this.appOutputDir, appFilesArchiveName);

      if (this.platform === "osx") {
        console.log(`[Builder] Copy app files to ${appFilesArchiveName}`);
        await promisify(copy)(this.tempAppFilesDir, appFilesArchivePath);
      } else {
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
      }

      return;
    }

    /**
     * Runs extra steps in the build process that are OS specific.
     */
    async packageExtras() {
      // Extra steps should be set in a seperate class for the OS
      return;
    }

    /**
     * Generate the selected outputs for the build.
     */
    async generateOutputs() {
      let outputs = this.options.builds[this.platform];

      if (!outputs) {
        console.log("[Builder] No builds have been specified for the current platform")
        return;
      }

      for (const [outputName, value] of Object.entries(outputs)) {
        if (value) {
          console.log(`[Builder] Generating ${outputName} package`);
          let output;
          switch (outputName) {
            case "zip":
            case "tar.gz":
              output = new Archive(
                this.appOutputDir,
                this.options.outputDir,
                this._renderPackageName(),
                outputName
              );
              break;
            case "innoSetup":
              output = new Inno(
                this.appOutputDir,
                this.options.outputDir,
                this._renderPackageName(),
                value
              )
              break;
          }

          await output.build();
        }
      }

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
     * Applies customisations to the app's package.json file
     */
    async _customisePackageJson() {
      console.log("[Builder] Apply customisations to app package.json");
      let packageJSON = require(path.join(process.cwd(), "package.json"));

      // Add macOS product_string
      packageJSON["product_string"] = this.options.appFriendlyName;

      fs.writeFileSync(path.join(this.tempAppFilesDir, "package.json"), JSON.stringify(packageJSON));
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
