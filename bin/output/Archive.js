(function () {
  "use strict";
  const archiver = require("archiver");
  const fs = require("fs");

  const Output = require("./Output");

  /**
   * Class for creating zip/tar.gz archives.
   */
  class Archive extends Output {
    /**
     * @param {String} inputDir The path to the directory of files to package.
     * @param {String} outputDir The path to the directory to output the package to.
     * @param {String} packageName The operating system the platform is being built for
     * @param {String} format The file format of the package expected values "zip" or "tar.gz".
     */
    constructor(inputDir, outputDir, packageName, format) {
      super(inputDir, outputDir, packageName);
      this.format = format;
      this.archiverOptions = (this.format === "tar.gz" ? {gzip: true} : {});
    }

    /**
     * Generates the package in the output directory.
     */
    async build() {
      const self = this;
      return new Promise(function (resolve, reject) {
        // Check for a valid archive format
        if (self.format !== "zip" || self.format !== "tar.gz") {
          reject(new Error(
              `Invalid archive format "${self.format}" was supplied (must be "zip" or "tar.gz")`));
        }

        // Create a file to stream archive data to
        const outputPath = path.join(self.outputDir, `${self.packageName}.${self.format}`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver(self.format, self.archiverOptions);

        // Append files from a sub-directory, putting its contents at the root of archive
        archive.pipe(output);
        archive.directory(self.inputDir, "/");
        archive.finalize();

        output.on("close", function () {
          resolve(archive);
        });

        archive.on("error", function (err) {
          reject(err);
        });
      });
    }
  }

  module.exports = Archive;
})();
