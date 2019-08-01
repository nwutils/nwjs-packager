(function () {
  "use strict";
  const archiver = require("archiver");
  const exec = require("child_process").exec;
  const fs = require("fs");
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
     * @param {String} packageName Name to give the package (excluding file extension).
     * @param {NwPackager} nwPackager The NwPackager instance.
     * @return {Promise}
     */
    static make(packageType, inputDir, outputDir, packageName, nwPackager) {
      return new Promise((resolve, reject) => {
        switch (packageType) {
          case "deb":
          case "rpm":
          case "pkg":
            // todo
            console.log(`  ${packageType} support coming soon!`);
            return resolve();
          // Handle win32 setup exe
          case "inno_setup":
            return CreatePackage.makeInnoSetupExe(nwPackager);
          // Handle archives
          case "tar":
          case "tar.gz":
          case "zip":
            return CreatePackage.makeArchive(packageType, inputDir, outputDir, packageName);
          default:
            reject(Error(`Unknown package type: "${packageType}"`));
        }
      });
    }

    /**
     * Create a compressed archive from a directory.
     * @param {String} format Format to compress to (eg ZIP or TAR).
     * @param {String} inputDir Location of directory to compress.
     * @param {String} outputDir Location to output compressed archive.
     * @param {String} packageName Name of compressed archive (excluding file extension).
     * @return {Promise}
     */
    static makeArchive(format, inputDir, outputDir, packageName) {
      console.log(`  Package ${inputDir} into ${format}...`);
      return new Promise((resolve, reject) => {
        // Add archive file extension to package dir
        const outputPath = path.join(outputDir, `${packageName}.${format}`);
        const output = fs.createWriteStream(outputPath);

        // Work with tar.gz
        let archive;
        if (format === "tar.gz") {
          archive = archiver("tar", {
            gzip: true,
          });
        } else {
          archive = archiver(format);
        }

        output.on("close", function () {
          resolve();
        });

        archive.on("error", function (error) {
          reject(error);
        });

        archive.pipe(output);

        // Append files from a sub-directory, putting its contents at the root of archive
        archive.directory(inputDir, "/").finalize();
      });
    }

    /**
     * Creates an setup exe using Inno Setup 5.
     * @param {NwPackager} nwp The NwPackager instance.
     * @return {Promise}
     */
    static makeInnoSetupExe(nwp) {
      return new Promise((resolve, reject) => {
        if (process.platform === "win32") {
          const setupFile = nwp.packageOptions.win.packages.inno_setup;
          console.log(`  [win32] Create Inno Setup 5 exe from ${setupFile}`);

          // Check Inno Setup is installed
          fs.open("C:/Program Files (x86)/Inno Setup 5", "r", function (err, fd) {
            if (err) {
              reject(Error("Please install Inno Setup 5 to create a win32 installer"));
            } else {
              // Run the Inno Setup CLI
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
  }
  module.exports = CreatePackage;
})();
