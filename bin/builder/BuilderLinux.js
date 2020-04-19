(function () {
  "use strict";
  const path = require("path");
  const {promisify} = require("util");
  const exec = promisify(require("child_process").exec);

  const rcedit = require('rcedit');
  const rimraf = promisify(require("rimraf"));

  const Builder = require("./Builder");

  /**
   * Windows specific packaging steps
   */
  class BuilderLinux extends Builder {
    constructor(userOptions = {}, platform = null, architecture = null) {
      super(userOptions, platform, architecture);
    }

    async packageExtras() {
      await this._appendFiles();
    }

    /**
     * Combines the nw exe with the app files
     */
    async _appendFiles() {
      console.log(`[BuilderLinux] Combine app files with nw binary`);
      const appendCmd = `cat nw package.nw > ${this.options.appPackageName} && chmod +x ${this.options.appPackageName}`;
      let child = await exec(appendCmd, { cwd: this.appOutputDir });

      console.log(child.stdout);
      console.error(child.stderr);

      // Remove unappended binary and app files zip
      await rimraf(path.join(this.appOutputDir, "nw"));
      await rimraf(path.join(this.appOutputDir, "package.nw"));

      return;
    }
  }

  module.exports = BuilderLinux;
}());