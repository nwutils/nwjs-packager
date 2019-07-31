#!/usr/bin/env node
(function () {
  "use strict";
  const argv = require("minimist")(process.argv.slice(2), {
    string: ["platforms", "version", "buildDir", "cacheDir"],
    boolean: ["run", "forceDownload", "quiet", "skipBuild"],
    alias: {"p": "platforms", "v": "version", "r": "run", "o": "buildDir", "f": "forceDownload", "s": "skipBuild" }
  });
  const NwPackager = require("./NwPackager");

  // Run the packager if run from cli
  if (require.main === module) {
    // Convert platforms string to array
    if ("platforms" in argv) {
      argv.platforms = argv.platforms.split(",");
    }
    const nwp = new NwPackager(argv);

    console.log("Welcome to nwjs-packager, nw-builder with added package creation!");
    nwp.build(argv.skipBuild).then(function () {
      nwp.package();
      console.log("Finished!");
    }).catch(function (error) {
      console.error(error);
    });
  } else {
    // Required as a module
    module.exports = NwPackager;
  }
})();
