(function () {
  "use strict";
  const childProcess = require("child_process");
  const fs = require("fs");

  const Output = require("./Output");

  /**
   * Class for creating Inno Setup exe the creation of a package
   */
  class Inno extends Output {
    /**
     * @param {String} inputDir The path to the directory of files to package.
     * @param {String} outputDir The path to the directory to output the package to.
     * @param {String} packageName The operating system the platform is being built for
     * @param {String|Boolean} innoFile The location of an Inno Setup .iss file.
     *                                  Alternatively set to `true` to have NWP generate the file.
     */
    constructor(inputDir, outputDir, packageName, innoFile) {
      super(inputDir, outputDir, packageName);
      this.innoFile = innoFile;
      this.innoExeDir = "C:/Program Files (x86)/Inno Setup 5";
    }

    /**
     * Generates the package in the output directory.
     */
    async build() {
      const self = this;

      // Generate the .iss file if boolean value used
      if (this.innoFile === true) {
        // this.innoFile = this.methodToGenerateSetupFile();
      }

      // Check Inno Setup is installed
      await new Promise(function (resolve, reject) {
        fs.open(self.innoExeDir, "r", function (err, fd) {
          if (err) {
            console.log(err);
            reject(new Error("Please install Inno Setup 5 to create a win32 installer"));
          } else {
            resolve(true);
          }
        });
      });

      // Run the Inno Setup CLI
      // TODO handle relative setup file paths
      const command = childProcess.execFile(`${this.innoExeDir}/ISCC.exe`, [this.innoFile]);
      command.stdout.on("data", function (data) {
        console.log(data.toString());
      });

      // Return true if the build was successful
      return new Promise(function (resolve, reject) {
        command.on("close", function (code) {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`Inno Setup build failed (error code ${code})`));
          }
        });
      });
    }
  }

  module.exports = Inno;
})();
