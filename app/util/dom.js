function $(q) {
  var ret = Array.prototype.slice.call(
    document.querySelectorAll(q), 0);

  return ret;
}

module.exports = {
  $
};