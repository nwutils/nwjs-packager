(function () {
  "use strict";
  /**
   * Generic class for the creation of an output package
   */
  class Output {
    /**
     * @param {String} inputDir The path to the directory of files to package.
     * @param {String} outputDir The path to the directory to output the package to.
     * @param {String} packageName The operating system the platform is being built for
     */
    constructor(inputDir, outputDir, packageName) {
      this.inputDir = inputDir;
      this.outputDir = outputDir;
      this.packageName = packageName;
    }

    /**
     * Generates the package in the output directory.
     */
    async build() {
      return;
    }
  }

  module.exports = Output;
})();
