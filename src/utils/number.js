module.exports = {
  isValidNumber: function (n, maxPrecision) {
    if (typeof n !== 'number') return false
    n = n.toString()
    if (!n) return false
    if (n.indexOf('.') != -1) {
      var parts = n.split('.')
      if (parts.length != 2) return false
      if (parts[1].length !== maxPrecision) return false
    }
    return true
  },

}