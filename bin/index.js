#!/usr/bin/env node
(function() {
  "use strict";
  const NwPackager = require("./NwPackager");
  const path = require("path");

  if (require.main === module) {
    // Run the packager if run from cli
    const nwp = new NwPackager({
      files: path.join(process.cwd(), "**"),
      platforms: ["win32"]
    });

    nwp.build().then(function() {
      console.log("Finished!");
    }).catch(function(error) {
      console.error(error);
    });
  } else {
    // Required as a module
    module.exports = NwPackager;
  }
})();
