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

      // Run the nw binary
      console.log("[Runner] Run nw binary");
      let command;
      if (this.platform === "osx") {
        // Note the macOS open command is used rather than navigating to nwjs.app/Contents/MacOS/nwjs
        // because WebRTC doesn't work otherwise
        command = await execFile("open", ["-a", path.join(nwDirPath, "nwjs.app"), "--args", process.cwd()])
      } else {
        command = await execFile(path.join(nwDirPath, "nw"), [process.cwd()]);
      }
      console.log(command.stdout);

      return;
    }
  }

  module.exports = Runner;
})();
