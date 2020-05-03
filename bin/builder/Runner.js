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
      super(userOptions, platform, architecture, "sdk");
    }

    /**
     * Downloads an NW.js binary, and runs the app with it.
     */
    async run() {
      console.log("[Runner] Start");

      // Unzip the nw archive to the cache directory
      const nwDirPath = await this.downloader.get();
      const nwBinaryPath = (this.platform === "osx" ? path.join(nwDirPath, "nwjs.app", "Contents", "MacOS", "nwjs") : path.join(nwDirPath, "nw"));

      console.log("[Runner] Run nw binary");
      const command = await execFile(nwBinaryPath, [process.cwd()]);
      console.log(command.stdout);

      return;
    }
  }

  module.exports = Runner;
})();
