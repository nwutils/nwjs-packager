(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");

  /**
   * Additional actions to run on a build before packaging. 
   */
  class PreActions {
    /**
     * Performs an action on a build before packaging.
     * @param {String} preType The action to perform (eg add .desktop file for Linux).
     * @param {*} outputDir The directory to perform the action.
     * @param {NwPackager} nwPackager The NwPackager instance.
     * @return {Promise}
     */
    static run(preType, outputDir, nwPackager) {
      return new Promise((resolve, reject) => {
        switch (preType) {
          case "desktop_file":
            return PreActions.makeDesktopFile(nwPackager, outputDir);
          case "inno_setup_file":
            // todo
            console.log(`  ${preType} support coming soon!`);
            return resolve();
          default:
            reject(Error("Invalid pre action type entered"));
        }
      });
    }

    /**
     * Creates a Linux .desktop file.
     * @param {NwPackager} nwp An NwPackager instance.
     * @param {String} outputDir The directory to output the file.
     * @return {Promise}
     */
    static makeDesktopFile(nwp, outputDir) {
      console.log(`  Making .desktop file in ${outputDir}`);
      return new Promise((resolve, reject) => {
        const filePath = path.join(outputDir, `${nwp.NwBuilder.options.appName}.desktop`);
        const fileContents =
`[Desktop Entry]
Name=${nwp.NwBuilder.options.appName}
Version=${nwp.NwBuilder.options.appVersion}
Exec=bash -c "cd $(dirname %k) && ./${nwp.NwBuilder.options.appName}"
Type=Application
Terminal=false`;

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
  module.exports = PreActions;
})();
