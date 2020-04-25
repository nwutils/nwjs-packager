(function () {
  "use strict";
  const { promisify } = require("util");
  const exec = promisify(require("child_process").exec);
  const fs = require("fs");
  const path = require("path");

  const copy = require("recursive-copy");
  const rimraf = require("rimraf");

  const Builder = require("./Builder");

  /**
   * Windows specific packaging steps
   */
  class BuilderOsx extends Builder {
    constructor(userOptions = {}, platform = null, architecture = null) {
      super(userOptions, platform, architecture);
      this.osxAppPath = path.join(this.appOutputDir, "nwjs.app");
    }

    async packageExtras() {
      await this._addIcon();
      await this._renameHelpers();
      await this._updateInfoPlist();
      await this._appendFiles();
    }

    /**
     * Sets the icon and the version of the app's executable.
     */
    async _addIcon() {
      console.log(`[BuilderOsx] Add icon to output .app`);

      if (this.options.appMacIcon) {
        const osxIconPath = path.join(this.osxAppPath, "Contents", "Resources", "app.icns");

        // Replace default icon with custom one
        await promisify(rimraf)(osxIconPath);
        await promisify(copy)(this.options.appMacIcon, path.join(this.osxAppPath, "Contents", "Resources", "app.icns"));

        return;
      }
    }

    async _renameHelpers() {
      return;
    }

    async _updateInfoPlist() {
      return;
    }

    /**
     * Combines the nw.exe with the app files
     */
    async _appendFiles() {
      console.log(`[BuilderOsx] Combine app files with nw.app`);

      // Rename the .app package
      const newOsxAppPath = path.join(this.appOutputDir, `${this.options.appPackageName}.app`);
      fs.renameSync(this.osxAppPath, newOsxAppPath);

      // Move zip of app files inside of the .app
      const appFilesArchivePath = path.join(this.appOutputDir, "app.nw");
      fs.renameSync(appFilesArchivePath, path.join(newOsxAppPath, "Contents", "Resources", "app.nw"));

      return;
    }
  }

  module.exports = BuilderOsx;
}());
