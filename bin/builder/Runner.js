(function () {
  "use strict";
  const childProcess = require("child_process");
  const path = require("path");
  const process = require("process");

  const extract = require("extract-zip");

  const Builder = require("./Builder");

  /**
   * Class for running an app using an NW.js binary
   */
  class Runner extends Builder {
    /**
     * 
     * @param {Object} userOptions An hash of options for the build
     * @param {String} platform The operating system to build for (default is the current platform)
     * @param {String} architecture The architecture to build for (x64 or ia32)
     */
    constructor(userOptions = {}, platform = null, architecture = null) {
      super(userOptions, platform, architecture);
    }

    /**
     * Downloads an NW.js binary, and runs the app with it.
     */
    async run() {
      console.log("[Runner] Start");

      // Unzip the nw archive to the cache directory
      const nwArchivePath = await this.downloader.get();
      await extract(nwArchivePath, {dir: this.options.cacheDir});

      // Run the command `nw path/to/app`
      const nwBinaryPath = path.join(this.options.cacheDir, this.downloader.fileName(), "nw");
      const command = childProcess.execFile(nwBinaryPath, [process.cwd()]);
      command.stdout.on("data", function (data) {
        console.log(data.toString());
      });

      // Return true if the build was successful
      return new Promise(function (resolve, reject) {
        command.on("close", function (code) {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`Error closing NW.js (error code ${code})`));
          }
        });
      });
    }
  }

  module.exports = Runner;
})();
