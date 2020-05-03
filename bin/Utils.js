(function () {
  /**
   * General helper methods.
   */
  class Utils {
    /**
     * Converts a string to titlecase (eg "hello world" becomes "Hello World")
     * @param {String} string The string to convert.
     * @return {String} The converted string.
     */
    static titleCase(string) {
      string = string.toLowerCase().split(" ").map(function (word) {
        return word.replace(word[0], word[0].toUpperCase());
      }).join(" ");
      return string;
    }
  }

  module.exports = Utils;
})();
