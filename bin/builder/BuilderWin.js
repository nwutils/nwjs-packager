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
  class BuilderWin extends Builder {
    constructor(userOptions = {}, platform = null, architecture = null) {
      super(userOptions, platform, architecture);
    }

    async packageExtras() {
      await this._addIcon();
      await this._appendFiles();
    }

    /**
     * Sets the icon and the version of the app's executable.
     */
    async _addIcon() {
      console.log(`[BuilderWin] Add icon to output exe`);
      let outputExe = path.join(this.appOutputDir, "nw.exe");

      return await rcedit(outputExe, {
        "file-version": this.options.appVersion,
        "product-version": this.options.appVersion,
        "icon": this.options.appWinIcon,
        "version-string": {
          "FileDescription": this.options.appDescription,
          "LegalCopyright": this.options.appCopyright,
          "ProductName": `${this.options.appFriendlyName}`,
          "OriginalFilename": ""
        }
      });
    }

    /**
     * Combines the nw.exe with the app files
     */
    async _appendFiles() {
      const appendCmd = `copy /b nw.exe+package.nw ${this.options.appPackageName}.exe`;
      let child = await exec(appendCmd, { cwd: this.appOutputDir });

      console.log(child.stdout);
      console.error(child.stderr);

      // Remove unappended binary and app files zip
      await rimraf(path.join(this.appOutputDir, "nw.exe"));
      await rimraf(path.join(this.appOutputDir, "package.nw"));

      return;
    }
  }

  module.exports = BuilderWin;
}());