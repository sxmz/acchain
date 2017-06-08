const CHAIN_LEVEL_TOKENS = ['BTC', 'ETH', 'LTC', 'CBTETF']
const UNLOCK_CNDITION = {
    VOTE: 0,
    ICO: 1
}

module.exports = {
  isChainLevelToken: function (currency) {
    return CHAIN_LEVEL_TOKENS.indexOf(currency) != -1
  },
  isValidUnlockCondition: function (c) {
    return c >= UNLOCK_CNDITION.VOTE && c <= UNLOCK_CNDITION.ICO
  }
}