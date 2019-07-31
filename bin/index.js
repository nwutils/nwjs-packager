#!/usr/bin/env node
(function () {
  "use strict";
  const argv = require("minimist")(process.argv.slice(2));
  const NwPackager = require("./NwPackager");

  if (require.main === module) {
    // Run the packager if run from cli
    const nwp = new NwPackager(argv);

    console.log("Welcome to nwjs-packager, nw-builder with added package creation!");
    nwp.build().then(function () {
      console.log("Finished!");
    }).catch(function (error) {
      console.error(error);
    });
  } else {
    // Required as a module
    module.exports = NwPackager;
  }
})();
