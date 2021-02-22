# nwjs-packager

Build your NW.js app and generate archives, packages, setup files and more! nwjs-packager focuses on making building NW.js "just work".

## Key Features

* Moves your app's files to a temporary directory and runs `npm install --production`
* Option to quickly run your app without building for testing
* Downloads NW.js binaries and combines them with your app's files
* Generates `zip` or `tar.gz` archives and Windows installer executable files

### macOS Features

* Customises app icons
* Properly customises Info.plist / InfoPlist.strings with your app's name
* Adds correct product_string to package.json to allow binaries to be renamed

### Windows Features

* Customises executable icons and file properties
* Generates an installer (using Inno Setup)

### Linux Features

* Generates a .desktop file for your app

## Installation

`npm install nwjs-packager --save-dev`

## Usage

Add an `nwjs-packager` block to your app's package.json file.

### Example package.json extract

```jsonc
  ...
  "nwjs-packager": {
    "nwVersion": "0.45.4",
    "appFriendlyName": "Demo App",
    "appMacIcon": "bin/icon.icns",
    "appWinIcon": "bin/icon.ico",
    "files": ["bin/**"],
    "builds": {
      "linux": {"tar.gz": true},
      "osx": {"zip": true},
      "win": {"zip": true}
    }
  }
  ...
```

### Build mode

To build your app for the current platform and architecture simply run from a terminal window:

```bash
nwp
```

### Run mode

To quickly run your app in NW.js without building it (ie during development) run:

```bash
nwp -r
```

## Options

All options should added in your app's package.json file. Possible options with their default values are:

```jsonc
  ...
  "nwjs-packager": {
    // An array of files to include in the output packages. Globs are accepted.
    "files": [],
    // Location to store downloaded NW.js binaries
    "cacheDir": "(os.homedir)/.nwjs-packager/cache",
    // Location to store app files ready for packaging
    "tempDir": "(os.homedir)/.nwjs-packager/temp",
    // Location to output packages to
    "outputDir": "(your app's directory)/build",

    // The version of NW.js to use (note versions should be in format without the letter "v", eg: "0.44.5")
    // The strings "stable", "latest" or "lts" are also permitted
    "nwVersion": "stable",
    // The "flavor" of NW.js to use (possible values "normal" or "sdk")
    "nwFlavor": "normal",

    // The nerd name for the app to use in file names (ie there should be no spaces)
    "appPackageName": "(the 'name' value in your package.json)",
    // The version of the app
    "appVersion": "(the 'version' value in your package.json)",
    // The file name format of output packages. Can use the special symbols %a%, %v% %p%
    // which are replaced with the appPackageName appName, appVersion and NW.js platform (eg osx-x64) respectively
    "appOutputName": "%a%-%v%-%p%",
    // The nice name of the app to display to the user (ie there can be spaces)
    "appFriendlyName": "(the 'name' value in your package.json, made titlecase and with '_' and '-' characters replaced with spaces)",
    // A path to a .icns file to use for generating the macOS icon
    "appMacIcon": null,
    // A path to an .ico file to use for generating the Windows icon
    "appWinIcon": null,
    // A short description of the app. Used in the macOS Info.plist and Windows fileVersion.
    "appDescription": "(the 'description' value in your package.json)",
    // The copyright detail of the app. Used in the macOS Info.plist and Windows fileVersion.
    "appCopyright": "(a string in the format '© {current_year} {package json 'author' value}')",

    // The platforms and outputs to build for
    // Possibles values are "deb", "rpm", "tar.gz", "zip", "pkg", "innoSetup" depending on the platform
    "builds": {
      "linux": {
        "tar.gz": true,
        "rpm": true, // TODO coming soon!
        "deb": true // TODO coming soon!
      },
      "osx": {
        "zip": true,
        "pkg": true // TODO coming soon!
      },
      "win": {
        "zip": true,
        "innoSetup": false // A path to a .iss file should be specified here
      },
    },

    // macOS InfoPlist.strings files can be specified to use for different languages here
    // Object keys should be in format "locale_id": "/path/to/InfoPlist.strings/file"
    // Possible locale ids are listed here: https://gist.github.com/jacobbubu/1836273
    "infoPlistStrings": {
      // If locale file isn't specified, the strings in the file for the object key "default" will be used
      // If a "default" file isn't specified, then nwjs-packager will automatically generate one
      "default": null
    }
  }
  ...
```

## Limitations

* Installable packages have not been implemented for macOS or Linux yet
* Currently you can only package a build for your current OS and architecture. (See #8)
* Auto generation of Inno Setup .iss files has not been implemented yet
* DO NOT add a `product_string` key to your package.json file. This will break nwjs-packager's "run mode" on macOS. nwjs-packager handles adding the a `product_string` during "build mode" only.

## Example usage

**[nwjs-packager-demo](https://github.com/charlielee/nwjs-packager-demo)** - a demo NW.js application used for testing.

## License

[MIT License](https://en.wikipedia.org/wiki/MIT_License). © 2020 Charlie Lee.
