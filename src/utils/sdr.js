var SDR_CURRENCY_LIST = [
  'RMB',
  'USD',
  'JPY',
  'EUR',
  'GBP'
]

module.exports = {
  isSdrCurrency: function(currency) {
    return SDR_CURRENCY_LIST.indexOf(currency) != -1
  },

  getSdrCurrenctList: function() {
    return SDR_CURRENCY_LIST
  }
}