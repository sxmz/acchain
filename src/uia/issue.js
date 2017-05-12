var assert = require('assert')
var async = require('async')
var bignum = require('bignumber')
var constants = require('../utils/constants.js')
var amountHelper = require('../utils/amount.js')
var numberHelper = require('../utils/number.js')
var assetHelper = require('./helper.js')

function Issue() {
  this.create = function (data, trs) {
    trs.recipientId = null
    trs.amount = 0
    trs.asset.uiaIssue = {
      currency: data.currency,
      amount: data.amount,
      exchangeRate: data.exchangeRate
    }
    return trs
  }

  this.calculateFee = function (trs, sender) {
    return 100 * constants.fixedPoint
  }

  this.verify = function (trs, sender, cb) {
    if (trs.recipientId) return setImmediate(cb, 'Invalid recipient')
    if (trs.amount != '0') return setImmediate(cb, 'Invalid transaction amount')

    var amount = trs.asset.uiaIssue.amount
    var error = amountHelper.validate(amount)
    if (error) return setImmediate(cb, error)

    var nExchangeRate = parseInt(trs.asset.uiaIssue.exchangeRate)
    if (!numberHelper.isValidNumber(nExchangeRate, 4) || nExchangeRate < 0.00001) {
      return setImmediate(cb, 'Invalid asset exercise unit')
    }

    var currency = trs.asset.uiaIssue.currency
    library.model.getAssetByCurrency(currency, function (err, result) {
      if (err) return cb('Database error: ' + err)
      if (!result) return cb('Asset not exists')
      if (!assetHelper.isChainLevelToken(currency) && result.issuerId !== sender.address) return cb('Permission not allowed')
      if (!result.approved) return cb('Asset not approved')
      var maximum = result.maximum
      var quantity = result.quantity
      if (bignum(quantity).plus(amount).gt(maximum)) return cb('Exceed issue limit')

      return cb()
    })
  }

  this.process = function (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  this.getBytes = function (trs) {
    var buffer = Buffer.concat([
      new Buffer(trs.asset.uiaIssue.currency, 'utf8'),
      new Buffer(trs.asset.uiaIssue.amount, 'utf8'),
      new Buffer(trs.asset.uiaIssue.exchangeRate, 'utf8')
    ])
    return buffer
  }

  this.apply = function (trs, block, sender, cb) {
    setImmediate(cb)
  }

  this.undo = function (trs, block, sender, cb) {
    setImmediate(cb)
  }

  this.applyUnconfirmed = function (trs, sender, cb) {
    var key = trs.asset.uiaIssue.currency + ':' + trs.type
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }

  this.undoUnconfirmed = function (trs, sender, cb) {
    library.oneoff.delete(trs.asset.uiaIssue.currency + ':' + trs.type)
    setImmediate(cb)
  }

  this.objectNormalize = function (trs) {
    var report = library.scheme.validate(trs.asset.uiaIssue, {
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          minLength: 3,
          maxLength: 26
        },
        amount: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        exchangeRate: {
          type: 'string',
          minLength: 1,
          maxLength: 20
        }
      },
      required: ['currency', 'amount', 'exchangeRate']
    })

    if (!report) {
      throw Error('Can\'t parse transaction: ' + library.scheme.getLastError())
    }

    return trs
  }

  this.dbRead = function (raw) {
    if (!raw.issues_currency) {
      return null
    } else {
      var asset = {
        transactionId: raw.t_id,
        currency: raw.issues_currency,
        amount: raw.issues_amount,
        exchangeRate: raw.issues_exchangeRate
      }

      return { uiaIssue: asset }
    }
  }

  this.dbSave = function (trs, cb) {
    var values = {
      transactionId: trs.id,
      approved2: 0,
      currency: trs.asset.uiaIssue.currency,
      amount: trs.asset.uiaIssue.amount,
      exchangeRate: trs.asset.uiaIssue.exchangeRate
    }
    library.model.add('issues', values, cb)
  }

  this.ready = function (trs, sender) {
    if (sender.multisignatures.length) {
      if (!trs.signatures) {
        return false
      }
      return trs.signatures.length >= sender.multimin - 1
    } else {
      return true
    }
  }
}

module.exports = new Issue