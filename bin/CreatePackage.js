(function () {
  "use strict";
  const archiver = require("archiver");

  /**
   * Class for package creation.
   */
  class CreatePackage {
    /**
     * Creates a package of a given type.
     * @param {*} packageType The type of package to build.
     * @param {*} inputDir Location of directory to compress.
     * @param {*} packageDir Location and name of output.
     * @return {Promise}
     */
    static make(packageType, inputDir, packageDir) {
      return new Promise((resolve, reject) => {
        switch (packageType) {
          case "directory":
          case "deb":
          case "rpm":
          case "pkg":
          case "inno_setup":
            // todo
            return resolve();
          // Handle archives
          case "tar":
          case "tar.gz":
          case "zip":
            return CreatePackage.makeArchive(packageType, inputDir, packageDir);
          default:
            reject(Error(`Unknown package type: "${packageType}"`));
        }
      });
    }

    /**
     * Create a compressed archive from a directory.
     * @param {*} format Format to compress to (eg ZIP or TAR).
     * @param {*} inputDir Location of directory to compress.
     * @param {*} packageDir Location and name of output.
     * @return {Promise}
     */
    static makeArchive(format, inputDir, packageDir) {
      return new Promise((resolve, reject) => {
        // Add archive file extension to package dir
        const output = fs.createWriteStream(`${packageDir}.${format}`);

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
          console.log(`archiver: Compress ${inputDir} to ${format}`);
          resolve();
        });

        archive.on("error", function (error) {
          reject(error);
        });

        archive.pipe(output);

        archive.directory(inputDir, "/").finalize();
      });
    }
  }
  module.exports = CreatePackage;
})();