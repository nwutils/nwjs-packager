#!/usr/bin/env node
(async function () {
  "use strict";
  const Inno = require("./package/Inno");

  try {
    let output = new Inno("test", "test", "test", "C:\\Users\\Charlie\\Documents\\GitHub\\boats-animator\\win-install\\setup.iss");
    let inno = await output.build();
    console.log(inno);
  } catch (err) {
    console.log(err);
  }
  // output.build()
  //     .then(console.log)
  //     .catch(function (err) {
  //       console.error(err);
  //     });
})();
