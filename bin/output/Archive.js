(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");

  const archiver = require("archiver");

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

      // Handle tar.gz
      if (format === "tar.gz") {
        this.format = "tar";
        this.archiverOptions = {gzip: true};
      } else {
        this.format = format;
        this.archiverOptions = {};
      }
    }

    /**
     * Generates the package in the output directory.
     */
    async build() {
      const self = this;
      return new Promise(function (resolve, reject) {
        // Check for a valid archive format
        if (self.format !== "zip" && self.format !== "tar") {
          reject(new Error(
              `Invalid archive format "${self.format}" was supplied. Possible values are "zip" or "tar(.gz)".`));
        }

        // Make the file name
        let fileName = `${self.packageName}.${self.format}`;
        if (this.archiverOptions["gzip"]) {
          fileName += ".gzip";
        }

        // Create a file to stream archive data to
        const outputPath = path.join(self.outputDir, fileName);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver(self.format, self.archiverOptions);

        // Append files from a sub-directory, putting its contents at the root of archive
        archive.pipe(output);
        archive.directory(self.inputDir, `/${self.packageName}`);
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
