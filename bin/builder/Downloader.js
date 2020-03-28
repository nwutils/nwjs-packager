(function () {
  "use strict";

  /**
   * Class for downloading an NW.js binary.
   */
  class Downloader {
    /**
     * 
     * @param {*} version 
     * @param {*} osName 
     * @param {*} architecture 
     * @param {*} sdk 
     * @param {*} baseUrl 
     */
    contructor(version, osName, architecture = 64, sdk = false, baseUrl = "https://dl.nwjs.io") {
      this.version = version;
      this.osName = osName;
      this.architecture = architecture;
      this.sdk = sdk;
      this.url = `${baseUrl}/v${this.version}/`;
    }

    /**
     * Downloads and unzips the archive containing an NW.js binary
     * @param {Boolean} forceDownload Fetch a given archive even if it has been
     *                  previously downloaded (default: false).
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
        (this.sdk ? "sdk" : ""),
        `v${version}`,
        this.osName,
        (this.architecture === 64 ? "x64" : "ia32")
      ];
      return `${downloadFileName.join("-")}.${this.platform === "linux" ? "tar.gz" : "zip"}`;
    }
  }

  module.exports = Downloader;
})();
