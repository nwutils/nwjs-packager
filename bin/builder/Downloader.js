(function () {
  "use strict";
  const fs = require("fs");
  const path = require("path");

  const bent = require("bent");
  const getJSON = bent("json");
  const getBuffer = bent("buffer");

  /**
   * Class for downloading an NW.js binary.
   */
  class Downloader {
    /**
     * @param {String} nwVersion The version of NW.js to download (eg "v0.44.5")
     * @param {String} nwFlavor The "flavor" of NW.js (possible values "normal" or "sdk")
     * @param {String} platform The operating system of the package
     *                          (possible values osx, linux or win)
     * @param {String} architecture The operating system architecture (possible values "x64" or "ia32")
     * @param {String} cacheDir The location to store the downloaded archive
     * @param {String} baseUrl The url of the website with the NW.js binary (default "https://dl.nwjs.io")
     */
    constructor(nwVersion, nwFlavor, platform, architecture, cacheDir, baseUrl = "https://dl.nwjs.io") {
      this.nwVersion = nwVersion;
      this.nwFlavor = nwFlavor;
      this.platform = platform;
      this.architecture = architecture;
      this.cacheDir = cacheDir;
      this.baseUrl = baseUrl;
    }

    /**
     * Downloads the archive containing an NW.js binary
     * @param {Boolean} forceDownload Fetch a given archive even if it has been
     *                                previously downloaded (default: false).
     */
    async get(forceDownload = false) {
      // Make the cache dir if needed

      // If version is "latest", "stable" or "lts" find out which version to use from
      // https://nwjs.io/versions.json
      const namedReleases = ["latest", "stable", "lts"];
      if (namedReleases.includes(this.nwVersion)) {
        // todo cache versions.json for offline use
        let versions = await getJSON("https://nwjs.io/versions.json");
        if (versions[this.nwVersion]) {
          this.nwVersion = versions[this.nwVersion];
        }
      }

      // See if the archive is already downloaded (if force is false)

      // Download the archive
      console.log(`[Downloader] Downloading ${this.fileName()} NW.js binary...`);
      const filePath = path.join(this.cacheDir, `${this.fileName()}${this._archiveExtension()}`);
      let download = await getBuffer(this._url());
      fs.writeFileSync(filePath, download);

      // Return the path of the downloaded binary
      return filePath;
    }

    /**
     * Builds the archive name to download in the correct format.
     * (eg nwjs-sdk-v0.28.1-linux-ia32.tar.gz or nwjs-v0.41.1-win-x64.zip)
     * @return {String} The file name of the archive to download
     */
    fileName() {
      const downloadFileName = [
        (this.nwFlavor === "sdk" ? "nwjs-sdk" : "nwjs"),
        this.nwVersion,
        this.platform,
        this.architecture,
      ];
      return downloadFileName.join("-");
    }


    /**
     * Builds the url containing the archive to download.
     */
    _url() {
      return `${this.baseUrl}/${this.nwVersion}/${this.fileName()}${this._archiveExtension()}`;
    }

    _archiveExtension() {
      return (this.platform === "linux" ? ".tar.gz" : ".zip");
    }
  }

  module.exports = Downloader;
})();
