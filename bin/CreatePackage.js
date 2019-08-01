(function () {
  "use strict";
  const archiver = require("archiver");
  const fs = require("fs");

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
     * @return {Promise}
     */
    static make(packageType, inputDir, outputDir, packageName) {
      return new Promise((resolve, reject) => {
        switch (packageType) {
          case "deb":
          case "rpm":
          case "pkg":
          case "inno_setup":
            // todo
            console.log(`  ${packageType} support coming soon!`);
            return resolve();
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
  }
  module.exports = CreatePackage;
})();