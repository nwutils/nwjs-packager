(function () {
  "use strict";
  const { promisify } = require("util");
  const exec = promisify(require("child_process").exec);
  const fs = require("fs");
  const path = require("path");

  const copy = require("recursive-copy");
  const glob = require("glob");
  const rimraf = require("rimraf");
  const plist = require('simple-plist');

  const Builder = require("./Builder");

  /**
   * Windows specific packaging steps
   */
  class BuilderOsx extends Builder {
    constructor(userOptions = {}, platform = null, architecture = null) {
      super(userOptions, platform, architecture);
      // The path of the nwjs.app of the build
      this.osxAppPath = path.join(this.appOutputDir, "nwjs.app");
    }

    async packageExtras() {
      await this._addIcon();
      await this._updateInfoPlist();
      await this._updateInfoPlistStrings();
      await this._renameHelpers();
      await this._appendFiles();
    }

    /**
     * Sets the icon and the version of the app's executable.
     */
    async _addIcon() {
      console.log(`[BuilderOsx] Add icon to output .app`);

      if (this.options.appMacIcon) {
        const osxIconPath = path.join(this.osxAppPath, "Contents", "Resources", "app.icns");

        // Replace default icon with custom one
        await promisify(rimraf)(osxIconPath);
        await promisify(copy)(this.options.appMacIcon, path.join(this.osxAppPath, "Contents", "Resources", "app.icns"));

        return;
      }
    }

    /**
     * Update the app name from nwjs in all of the app plist files
     */
    async _updateInfoPlist() {
      // List of files to rename in format {path: "path/to/File", keysToUpdate: ["plist", "keys", "to", "change"]}
      const frameworkHelperDir =  path.join(this.osxAppPath, "Contents", "Frameworks", "nwjs Framework.framework", "Helpers");
      let infoPlistPaths = [
        {
          "path": path.join(this.osxAppPath, "Contents", "Info.plist"),
          "keysToUpdate": {
            "CFBundleDisplayName": this.options.appFriendlyName,
            "CFBundleExecutable": this.options.appFriendlyName,
            "CFBundleName": this.options.appFriendlyName
          }
        }
      ];

      // NW.js 40+ implements additional helper apps that need renaming
      // NaN nwVersions are considered to be >=40 because the "latest" and "stable" versions are >=40
      if (this.options.nwjsMajorVersion >= 40 || isNaN(this.options.nwjsMajorVersion)) {
        infoPlistPaths.push(
          {
            "path": path.join(frameworkHelperDir, "nwjs Helper (GPU).app", "Contents", "Info.plist"),
            "keysToUpdate": {
              "CFBundleDisplayName": this.options.appFriendlyName,
              "CFBundleExecutable": this.options.appFriendlyName,
              "CFBundleName": this.options.appFriendlyName
            }
          },
          {
            "path": path.join(frameworkHelperDir, "nwjs Helper (Plugin).app", "Contents", "Info.plist"),
            "keysToUpdate": {
              "CFBundleDisplayName": this.options.appFriendlyName,
              "CFBundleExecutable": this.options.appFriendlyName,
              "CFBundleName": this.options.appFriendlyName
            }
          },
          {
            "path": path.join(frameworkHelperDir, "nwjs Helper (Renderer).app", "Contents", "Info.plist"),
            "keysToUpdate": {
              "CFBundleDisplayName": this.options.appFriendlyName,
              "CFBundleExecutable": this.options.appFriendlyName,
              "CFBundleName": this.options.appFriendlyName
            }
          },
          {
            "path": path.join(frameworkHelperDir, "nwjs Helper.app", "Contents", "Info.plist"),
            "keysToUpdate": {
              "CFBundleDisplayName": this.options.appFriendlyName,
              "CFBundleExecutable": this.options.appFriendlyName,
              "CFBundleName": this.options.appFriendlyName
            }
          }
        );
      } else {
        // Pre NW.js 40 there was only 1 app helper
        // A glob is required due to the path for this changing depending on selected the Chromium version
        const appHelperDir = glob.sync(path.join(this.osxAppPath, "Contents", "Versions", "*"))[0];

        infoPlistPaths.push(
          {
            "path": path.join(appHelperDir, "nwjs Helper.app", "Contents", "Info.plist"),
            "keysToUpdate": {
              "CFBundleDisplayName": this.options.appFriendlyName,
              "CFBundleExecutable": this.options.appFriendlyName,
              "CFBundleName": this.options.appFriendlyName
            }
          }
        );
      }

      infoPlistPaths.forEach(function(pathObj) {
        console.log(`[BuilderOsx] Update Info.plist at ${pathObj["path"]}`);
        // Read the file
        let plistData = plist.readFileSync(pathObj["path"]);
        // Add customised options
        plistData = Object.assign(plistData, pathObj["keysToUpdate"]);
        // Update the file
        plist.writeFileSync(pathObj["path"], plistData);
      });

      return;
    }

    /**
     * Update the app name from nwjs/Chromium in all of the app InfoPlist.strings files (language specific translations)
     */
    async _updateInfoPlistStrings() {
      // Do a glob search to find all of the *.lproj/InfoPlist.strings files in Contents/Resources
      const fileGlob = path.join(this.osxAppPath, "Contents", "Resources", "*.lproj", "InfoPlist.strings");
      const infoPlistStringsFiles = glob.sync(fileGlob);

      // Update each file with customised InfoPlist.strings files
      await Promise.all(infoPlistStringsFiles.map(async (filePath) => {
        await this._writeInfoPlistStrings(filePath)
      }));

      return;
    }

    async _writeInfoPlistStrings(filePath) {
      console.log(`[BuilderOsx] Update ${filePath}`)
      const defaultFileContents = `NSLocationUsageDescription = "(this app's developers need to add an NSLocationUsageDescription key to an InfoPlist.strings file)";
NSCameraUsageDescription = "(this app's developers need to add an NSCameraUsageDescription key to an InfoPlist.strings file)";
CFBundleName = "${this.options.appFriendlyName}";
CFBundleDisplayName = "${this.options.appFriendlyName}";
CFBundleGetInfoString = "${this.options.appFriendlyName} ${this.options.appVersion}, ${this.options.appCopyright}";
NSHumanReadableCopyright = "${this.options.appCopyright}";
NSBluetoothPeripheralUsageDescription = "(this app's developers need to add an NSBluetoothPeripheralUsageDescription key to an InfoPlist.strings file)";
NSMicrophoneUsageDescription = "(this app's developers need to add an NSMicrophoneUsageDescription key to an InfoPlist.strings file)";
`;

      // This looks ridiculous but basically gets the text in the file path between ".lproj" and the "/" immediately before it
      let localeId = filePath.split(".lproj")[0].split("/").slice("-1")[0];

      // Remove old InfoPlist.strings file
      await promisify(rimraf)(filePath);

      // Use the user's custom file for that language
      if (this.options.infoPlistStrings.hasOwnProperty(localeId)) {
        await promisify(copy)(this.options.infoPlistStrings[localeId], filePath);

      // Or the user's default file
      } else if (this.options.infoPlistStrings["default"]) {
        await promisify(copy)(this.options.infoPlistStrings["default"], filePath);

      // Or nwjs-packager's default file
      } else {
        fs.writeFileSync(filePath, defaultFileContents);
      }

      return;
    }

    async _renameHelpers() {
      // List of files to rename in tuples [old name, new name]
      // Note nwjs Framework.framework should retain it's original name
      let helperPaths = [
        // Main app executable file
        [
          path.join(this.osxAppPath, "Contents", "MacOS", "nwjs"),
          path.join(this.osxAppPath, "Contents", "MacOS", this.options.appFriendlyName)
        ]
      ];

      // NW.js 40+ implements additional helper apps that need renaming
      // NaN nwVersions are considered to be >=40 because the "latest" and "stable" versions are >=40
      if (this.options.nwjsMajorVersion >= 40 || isNaN(this.options.nwjsMajorVersion)) {
        const frameworkHelperDir =  path.join(this.osxAppPath, "Contents", "Frameworks", "nwjs Framework.framework", "Helpers");
        helperPaths.push(
          // App helpers
          [
            path.join(frameworkHelperDir, "nwjs Helper (GPU).app"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (GPU).app`)
          ],
          [
            path.join(frameworkHelperDir, "nwjs Helper (Plugin).app"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Plugin).app`)
          ],
          [
            path.join(frameworkHelperDir, "nwjs Helper (Renderer).app"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Renderer).app`)
          ],
          [
            path.join(frameworkHelperDir, "nwjs Helper.app"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper.app`)
          ],
          // App helper executable files
          [
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (GPU).app`, "Contents", "MacOS", "nwjs Helper (GPU)"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (GPU).app`, "Contents", "MacOS", `${this.options.appFriendlyName} Helper (GPU)`)
          ],
          [
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Plugin).app`, "Contents", "MacOS", "nwjs Helper (Plugin)"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Plugin).app`, "Contents", "MacOS", `${this.options.appFriendlyName} Helper (Plugin)`)
          ],
          [
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Renderer).app`, "Contents", "MacOS", "nwjs Helper (Renderer)"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper (Renderer).app`, "Contents", "MacOS", `${this.options.appFriendlyName} Helper (Renderer)`)
          ],
          [
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper.app`, "Contents", "MacOS", "nwjs Helper"),
            path.join(frameworkHelperDir, `${this.options.appFriendlyName} Helper.app`, "Contents", "MacOS", `${this.options.appFriendlyName} Helper`)
          ]
        );
      } else {
        // Pre NW.js 40 there was only 1 app helper
        // A glob is required due to the path for this changing depending on selected the Chromium version
        const appHelperDir = glob.sync(path.join(this.osxAppPath, "Contents", "Versions", "*"))[0];
        console.log(appHelperDir);

        helperPaths.push(
          // App helper
          [
            path.join(appHelperDir, "nwjs Helper.app"),
            path.join(appHelperDir, `${this.options.appFriendlyName} Helper.app`)
          ],
           // App helper executable file
          [
            path.join(appHelperDir,`${this.options.appFriendlyName} Helper.app`, "Contents", "MacOS", "nwjs Helper"),
            path.join(appHelperDir, `${this.options.appFriendlyName} Helper.app`, "Contents", "MacOS", `${this.options.appFriendlyName} Helper`)
          ]
        );
      }

      const self = this;
      helperPaths.forEach(function(pathTuple) {
        let oldPath = pathTuple[0];
        let newPath = pathTuple[1];
        console.log(`[BuilderOsx] Rename ${oldPath}`);
        fs.renameSync(oldPath, newPath);
      });

      return;
    }

    /**
     * Combines the nw.exe with the app files
     */
    async _appendFiles() {
      console.log(`[BuilderOsx] Combine app files with nw.app`);

      // Rename the .app package
      const newOsxAppPath = path.join(this.appOutputDir, `${this.options.appFriendlyName}.app`);
      fs.renameSync(this.osxAppPath, newOsxAppPath);

      // Move zip of app files inside of the .app
      const appFilesArchivePath = path.join(this.appOutputDir, "app.nw");
      fs.renameSync(appFilesArchivePath, path.join(newOsxAppPath, "Contents", "Resources", "app.nw"));

      return;
    }
  }

  module.exports = BuilderOsx;
}());
