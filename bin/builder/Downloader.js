(function () {
  "use strict";

  /**
   * Class for downloading an NW.js binary.
   */
  class Downloader {
    /**
     * @param {String} nwVersion The version of NW.js to download (eg "0.44.5")
     * @param {String} nwFlavor The "flavor" of NW.js (possible values "normal" or "sdk")
     * @param {String} platform The operating system of the package
     *                          (possible values darwin, linux or win32)
     * @param {String} architecture The operating system architecture (possible values "x64" or "ia32")
     * @param {String} baseUrl The url of the website with the NW.js binary (default "https://dl.nwjs.io")
     */
    contructor(nwVersion, nwFlavor, platform, architecture, baseUrl = "https://dl.nwjs.io") {
      this.nwVersion = nwVersion;
      this.nwFlavor = nwFlavor;
      this.platform = platform;
      this.architecture = architecture;
      this.url = `${baseUrl}/v${this.nwVersion}/`;
    }

    /**
     * Downloads and unzips the archive containing an NW.js binary
     * @param {Boolean} forceDownload Fetch a given archive even if it has been
     *                                previously downloaded (default: false).
     */
    get(forceDownload = false) {
      // Make the cache dir if needed

      // If version is "latest", "stable" or "lts" find out which version to use from
      // https://nwjs.io/versions.json

      // See if the archive is already downloaded (if force is false)

      // Download the archive

      // Unzip the archive

      // Return the path of the downloaded binary
    }

    /**
     * Builds the archive name to download in the correct format.
     * (eg nwjs-sdk-v0.28.1-linux-ia32.tar.gz or nwjs-v0.41.1-win-x64.zip)
     * @return {String} The file name of the archive to download
     */
    _fileName() {
      const downloadFileName = [
        "nwjs",
        (this.nwFlavor === "sdk" ? "sdk" : ""),
        `v${this.nwVersion}`,
        this.platform,
        this.architecture,
      ];
      return `${downloadFileName.join("-")}.${this.platform === "linux" ? "tar.gz" : "zip"}`;
    }
  }

  module.exports = Downloader;
})();
