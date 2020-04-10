(function () {
  "use strict";
  const {promisify} = require("util");
  const execFile = promisify(require("child_process").execFile);
  const path = require("path");
  const process = require("process");

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
      const nwDirPath = await this.downloader.get();
      const nwBinaryPath = path.join(nwDirPath, this.platform === "osx" ? "nwjs.app" : "nw");

      let command;
      if (this.platform === "osx") {
        command = await execFile("open", ["-a", nwBinaryPath, "--args", process.cwd()]);
      } else {
        command = await execFile(nwBinaryPath, [process.cwd()]);
      }
      console.log(command.stdout);

      return;
    }
  }

  module.exports = Runner;
})();
