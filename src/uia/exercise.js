var assert = require('assert')
var async = require('async')
var bignum = require('bignumber')
var constants = require('../utils/constants.js')
var amountHelper = require('../utils/amount.js')

function Exercise() {
  this.create = function (data, trs) {
    trs.amount = 0
    trs.recipientId = null
    trs.asset.uiaExercise = {
      currency: data.currency,
      amount: data.amount
    }
    return trs
  }

  this.calculateFee = function (trs, sender) {
    return 0.1 * constants.fixedPoint
  }

  this.verify = function (trs, sender, cb) {
    if (trs.recipientId) return setImmediate(cb, 'Invalid recipient')
    if (trs.amount != '0') return setImmediate(cb, 'Invalid transaction amount')

    var asset = trs.asset.uiaExercise
    var error = amountHelper.validate(asset.amount)
    if (error) return setImmediate(cb, error)

    library.model.getAssetByCurrency(asset.currency, function (err, assetDetail) {
      if (err) return cb('Database error: ' + err)
      if (!assetDetail) return cb('Asset not exists')
      if (!assetDetail.approved) return cb('Asset not approved')

      return cb()
    })
  }

  this.process = function (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  this.getBytes = function (trs) {
    var buffer = Buffer.concat([
      new Buffer(trs.asset.uiaExercise.currency, 'utf8'),
      new Buffer(trs.asset.uiaExercise.amount, 'utf8')
    ])
    return buffer
  }

  this.apply = function (trs, block, sender, cb) {
    var exercise = trs.asset.uiaExercise
    async.series([
      function (next) {
        library.model.updateAssetBalance(exercise.currency, '-' + exercise.amount, sender.address, next)
      },
      function (next) {
        library.model.addAssetQuantity(exercise.currency, '-' + exercise.amount, next)
      }
    ], cb)
  }

  this.undo = function (trs, block, sender, cb) {
    var exercise = trs.asset.uiaExercise
    async.series([
      function (next) {
        library.model.updateAssetBalance(exercise.currency, exercise.amount, sender.address, next)
      },
      function (next) {
        library.model.addAssetQuantity(exercise.currency, exercise.amount, next)
      }
    ], cb)
  }

  this.applyUnconfirmed = function (trs, sender, cb) {
    var exercise = trs.asset.uiaExercise
    var key = exercise.currency + ':' + sender.address
    var balance = library.balanceCache.getAssetBalance(sender.address, exercise.currency) || 0
    var surplus = bignum(balance).sub(exercise.amount)
    if (surplus.lt(0)) return setImmediate(cb, 'Insufficient asset balance')

    library.balanceCache.setAssetBalance(sender.address, exercise.currency, surplus.toString())
    setImmediate(cb)
  }

  this.undoUnconfirmed = function (trs, sender, cb) {
    var exercise = trs.asset.uiaExercise
    library.balanceCache.addAssetBalance(sender.address, exercise.currency, exercise.amount)
    setImmediate(cb)
  }

  this.objectNormalize = function (trs) {
    var report = library.scheme.validate(trs.asset.uiaExercise, {
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          minLength: 1,
          maxLength: 30
        },
        amount: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        }
      },
      required: ['currency', 'amount']
    })

    if (!report) {
      throw Error('Can\'t parse transaction: ' + library.scheme.getLastError())
    }

    return trs
  }

  this.dbRead = function (raw) {
    if (!raw.exercises_currency) {
      return null
    } else {
      var asset = {
        transactionId: raw.t_id,
        currency: raw.exercises_currency,
        amount: raw.exercises_amount
      }

      return { uiaExercise: asset }
    }
  }

  this.dbSave = function (trs, cb) {
    var currency = trs.asset.uiaExercise.currency
    var amount = trs.asset.uiaExercise.amount
    var values = {
      transactionId: trs.id,
      currency2: currency,
      amount: amount
    }
    library.model.add('exercises', values, cb)
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

module.exports = new Exercise