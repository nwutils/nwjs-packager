(function () {
  "use strict";
  const archiver = require("archiver");
  const exec = require("child_process").exec;
  const fs = require("fs");
  const mkdirp = require("mkdirp");
  const path = require("path");

  /**
   * Class for package creation.
   */
  class CreatePackage {
    /**
     * Creates a package of a given type.
     * @param {String} packageType The type of package to build.
     * @param {String} inputDir Location of directory to package.
     * @param {String} outputDir Location to output package.
     * @param {String} platform The current platform being built (eg "win32").
     * @param {NwPackager} nwPackager The NwPackager instance.
     * @param {Boolean} useOsSettings Determines whether to use the OS packageOptions (eg pO.win) or platform packageOptions (eg pO.win32).
     */
    constructor(packageType, inputDir, outputDir, platform, nwPackager, useOsSettings = true) {
      this.packageType = packageType;
      this.inputDir = inputDir;
      this.outputDir = outputDir;
      this.platform = platform;
      this.nwp = nwPackager;
      this.useOsSettings = useOsSettings;
      // The name to give the package (excluding file extension)
      this.packageName = this.nwp.renderPackageTemplates(platform);
    }

    /**
     * Create a compressed archive from a directory.
     * @return {Promise}
     */
    makeArchive() {
      const self = this;
      return new Promise((resolve, reject) => {
        console.log(`  Package ${self.inputDir} into ${self.packageType}`);

        // Add archive file extension to package dir
        const outputPath = path.join(self.outputDir, `${self.packageName}.${self.packageType}`);
        const output = fs.createWriteStream(outputPath);

        // Work with tar.gz
        let archive;
        if (self.packageType === "tar.gz") {
          archive = archiver("tar", {
            gzip: true,
          });
        } else {
          archive = archiver(self.packageType);
        }

        output.on("close", function () {
          resolve();
        });

        archive.on("error", function (error) {
          reject(error);
        });

        archive.pipe(output);

        // Append files from a sub-directory, putting its contents at the root of archive
        archive.directory(self.inputDir, "/").finalize();
      });
    }

    /**
     * Creates an setup exe using Inno Setup 5.
     * @return {Promise}
     */
    makeInnoSetupExe() {
      const self = this;
      // todo make sure only one file generated
      return new Promise((resolve, reject) => {
        // Can only build Inno Setup on Windows
        if (process.platform === "win32") {
          let setupFile = "";
          // Determine setup file location
          if (self.useOsSettings) {
            setupFile = self.nwp["packageOptions"]["win"]["packages"]["inno_setup"];
          } else {
            setupFile = self.nwp["packageOptions"][self.platform]["packages"]["inno_setup"];
          }
          // If boolean value rather than file name used, generate the setup file
          if (setupFile === true) {
            // todo setupFile = methodToGenerateSetupFile();
          }
          console.log(`  [win32] Create Inno Setup 5 exe from ${setupFile}`);

          // Check Inno Setup is installed
          fs.open("C:/Program Files (x86)/Inno Setup 5", "r", function (err, fd) {
            if (err) {
              reject(Error("Please install Inno Setup 5 to create a win32 installer"));
            } else {
              // Run the Inno Setup CLI
              // todo handle relative setup file paths
              exec(`cd C:/Program Files (x86)/Inno Setup 5/ && ISCC.exe ${setupFile}`, function (error, stdout, stderr) {
                if (error) {
                  reject(error);
                } else if (stderr) {
                  reject(stderr);
                } else {
                  resolve();
                }
              });
            }
          });
        } else {
          console.log("  [!win32] Must be on win32 to build Inno Setup exe");
          resolve();
        }
      });
    }

    /**
     * Creates and runs a package of a given type.
     * @param {String} packageType The type of package to build.
     * @param {String} inputDir Location of directory to package.
     * @param {String} outputDir Location to output package.
     * @param {String} platform The current platform being built (eg "win32").
     * @param {NwPackager} nwPackager The NwPackager instance.
     * @param {Boolean} useOsSettings Determines whether to use the OS packageOptions (eg pO.win) or platform packageOptions (eg pO.win32).
     * @return {Promise}
     */
    static make(packageType, inputDir, outputDir, platform, nwPackager, useOsSettings = true) {
      return new Promise((resolve, reject) => {
        const pack = new CreatePackage(packageType, inputDir, outputDir, platform, nwPackager, useOsSettings);
        switch (packageType) {
          case "deb":
          case "rpm":
          case "pkg":
            // todo
            console.log(`  ${packageType} support coming soon!`);
            return resolve();
          // Handle win32 setup exe
          case "inno_setup":
            return pack.makeInnoSetupExe();
          // Handle archives
          case "tar":
          case "tar.gz":
          case "zip":
            return pack.makeArchive();
          default:
            reject(Error(`Unknown package type: "${packageType}"`));
        }
      });
    }
  }
  module.exports = CreatePackage;
})();
