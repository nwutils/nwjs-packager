(function () {
  "use strict";
  const fs = require("fs");
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
      await this._makeDesktopFile();
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

    /**
     * Creates a Linux .desktop file.
     * @return {Promise}
     */
    async _makeDesktopFile() {
      console.log("[BuilderLinux] Make .desktop file");

      const filePath = path.join(this.appOutputDir, `${this.options.appPackageName}.desktop`);
      const fileContents =
`[Desktop Entry]
Name=${this.options.appFriendlyName}
Version=${this.options.appVersion}
Exec=bash -c "cd $(dirname %k) && ./${this.options.appPackageName}"
Type=Application
Terminal=false`;

      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContents, function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  module.exports = BuilderLinux;
}());