# nwjs-packager

Build your NW.js app and generate archives, packages, setup files and more! Apps are built using **[nw-builder](https://github.com/nwjs-community/nw-builder)** before generating the packages of your choice. The app can be used programmatically or via CLI.

### Pre-packaging features

* Auto generate `.desktop` files for Linux

### Available outputs

* All platforms: `.zip` or `.tar.gz`
* TODO: Linux: `.deb` or `.rpm`
* TODO: macOS: `.pkg`
* TODO: Windows: `.exe` (using [Inno Setup](http://www.jrsoftware.org/isinfo.php))

## Installation

`npm install nwjs-packager --save-dev`

## CLI usage

This is identical to that of [nw-builder](https://github.com/nwjs-community/nw-builder), except `nwp` should be used instead of `nwbuild`.

## Module usage

```node
const NwPackager = require("nwjs-packager");

let nwp = new NwPackager(buildOptions, packageOptions);

nwp.build().then(() => {
  return nwp.package();
}).then(() => {
  console.log("Finished!");
}.catch((error) => {
  console.error(error);
});
```

### buildOptions

This object takes all of the options accepted by [nw-builder](https://github.com/nwjs-community/nw-builder) with a few differences:

* `buildDir` and `cacheDir` path names must not start with `./` (ie use `cache` instead of `./cache`)
* `buildType` - the value of this is ignored and always set to `"default"`
* `platforms` - this must use "os-architecture" values rather than their shorthands (ie use `win32` instead of just `win`) 

All default values are also the same except for:

* `platforms` - this is set to the current OS's x32 and x64 variants (eg on Windows this would be `["win32", "win64"]`)

```node
const buildOptions = {
  "files": "path/to/nwfiles/**/**",
  "platforms": ["osx64", "win32", "win64"],
  "version": "0.14.6",
  ...
}
```

### packageOptions

This object contains nwjs-packager specific settings. The possible values with their default values are listed:

```node
const packageOptions = {
  // The file name format of output packages. Can use the special symbols %a%, %v% %p%
  // which are replaced with the nw-builder appName, appVersion and platform (eg osx64) respectively
  "package_name": "%a%-%v%-%p%",
  "linux": {
    "pre": {
      "desktop_file": true, // Toggles generating a Linux .desktop file
    },
    "packages": {
      "deb": true, // Toggles generating a .deb package
      "rpm": false, // Toggles generating an .rpm package
      "tar": false, // Toggles generating a .tar archive
      "tar.gz": true, // Toggles generating a .tar.gz archive
      "zip": false, // Toggles generating a .zip archive
    },
  },
  "osx": {
    "packages": {
      "pkg": true, // Toggles generating a .pkg package
      "tar": false,
      "tar.gz": false,
      "zip": true,
    },
  },
  "win": {
    "pre": {
      "inno_setup_file": false // Set to the location of a .iss file to use with Inno Setup 
    }
    "packages": {
      "inno_setup": true, // Toggles generating a .exe setup file with Inno Setup
      "tar": false,
      "tar.gz": false,
      "zip": true,
    },
  },
};
```

## License

[MIT License](https://en.wikipedia.org/wiki/MIT_License)
