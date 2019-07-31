(function() {
  "use strict";
  const NwBuilder = require("nw-builder");

  /**
   * Class for running NwPackager instances
   */
  class NwPackager {
    /**
     * Creates a new NwPackager instance
     * @param {Object} NwBuilderOptions The NwBuilder options to use.
     */
    constructor(NwBuilderOptions) {
      this.NwBuilder = new NwBuilder(NwBuilderOptions);
      this.NwBuilderOptions = NwBuilderOptions;
    }

    /**
     * Builds and packages an application
     * @return {Promise}
     */
    build() {
      return new Promise((resolve, reject) => {
        this.NwBuilder.build().then(function() {
          resolve();
        }).catch(function(error) {
          reject(error);
        });
      });
    }
  }
  module.exports = NwPackager;
})();
