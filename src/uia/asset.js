var assert = require('assert')
var async = require('async')
var bignum = require('bignumber')
var amountHelper = require('../utils/amount.js')
var constants = require('../utils/constants.js')
var sdrHelper = require('../utils/sdr.js')
var numberHelper = require('../utils/number.js')
var assetHelper = require('./helper.js')

function Asset() {
  this.create = function (data, trs) {
    trs.recipientId = null
    trs.amount = '0'
    trs.asset.uiaAsset = {
      name: data.name,
      currency: data.currency,
      desc: data.desc,
      category: data.category,
      maximum: data.maximum,
      precision: data.precision,
      estimateUnit: data.estimateUnit,
      estimatePrice: data.estimatePrice,
      exerciseUnit: data.exerciseUnit,
      unlockCondition: data.unlockCondition,
      extra: data.extra,
    }

    return trs
  }

  this.calculateFee = function (trs, sender) {
    return 10 * constants.fixedPoint
  }

  this.verify = function (trs, sender, cb) {
    if (trs.recipientId) return setImmediate(cb, 'Invalid recipient')
    if (trs.amount != '0') return setImmediate(cb, 'Invalid transaction amount')

    var asset = trs.asset.uiaAsset
    if (!asset.name || asset.name.length > 256) {
      return setImmediate(cb, 'Invalid asset name')
    }

    var issuerName;
    var currencyName;
    if (!assetHelper.isChainLevelToken(asset.currency)) {
      var nameParts = (asset.currency || '').split('.')
      if (nameParts.length != 2) return setImmediate(cb, 'Invalid asset currency name')
      issuerName = nameParts[0]
      currencyName = nameParts[1]
    } else {
      currencyName = asset.currency
    }

    if (!currencyName || !/^[A-Z][A-Z0-9]{2,9}$/.test(currencyName)) return setImmediate(cb, 'Invalid asset currency name')

    if (!asset.desc) return setImmediate(cb, 'Invalid asset desc')
    if (asset.desc.length > 4096) return setImmediate(cb, 'Invalid asset desc size')

    if (asset.precision > 16 || asset.precision < 0) return setImmediate(cb, 'Invalid asset precision')

    var error = amountHelper.validate(asset.maximum)
    if (error) return setImmediate(cb, error)

    if (!library.assetCategoryManager.isValidId(asset.category)) {
      return setImmediate(cb, 'Invalid asset category')
    }

    if (!sdrHelper.isSdrCurrency(asset.estimateUnit)) {
      return setImmediate(cb, 'Invalid asset estimate unit')
    }

    if (!numberHelper.isValidNumber(parseInt(asset.estimatePrice), 2)) {
      return setImmediate(cb, 'Invalid asset estimate price')
    }

    if (!numberHelper.isValidNumber(parseInt(asset.exerciseUnit), 0)) {
      return setImmediate(cb, 'Invalid asset exercise unit')
    }

    if (!assetHelper.isValidUnlockCondition(asset.unlockCondition)) {
      return setImmediate(cb, 'Invalid asset unlock condition')
    }

    library.model.exists('assets', { currency: asset.currency }, function (err, exists) {
      if (err) return cb(err)
      if (exists) return cb('Asset already exists')
      if (assetHelper.isChainLevelToken(asset.currency)) return cb(null)
      library.model.getIssuerByName(issuerName, ['issuerId'], function (err, issuer) {
        if (err) return cb(err)
        if (!issuer) return cb('Issuer not exists')
        if (issuer.issuerId != sender.address) return cb('Permission not allowed')
        return cb(null)
      })
    })
  }

  this.process = function (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  this.getBytes = function (trs) {
    var asset = trs.asset.uiaAsset
    var buffer = Buffer.concat([
      new Buffer(asset.name, 'utf8'),
      new Buffer(asset.currency, 'utf8'),
      new Buffer(asset.desc, 'utf8'),
      new Buffer(asset.category, 'utf8'),
      new Buffer(asset.maximum, 'utf8'),
      Buffer.from([asset.precision]),
      new Buffer(asset.estimateUnit, 'utf8'),
      new Buffer(asset.estimatePrice, 'utf8'),
      new Buffer(asset.exerciseUnit, 'utf8'),
      new Buffer(asset.extra, 'utf8'),
      Buffer.from([asset.unlockCondition])
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
    var key = trs.asset.uiaAsset.currency + ':' + trs.type
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }

  this.undoUnconfirmed = function (trs, sender, cb) {
    library.oneoff.delete(trs.asset.uiaAsset.currency + ':' + trs.type)
    setImmediate(cb)
  }

  this.objectNormalize = function (trs) {
    var report = library.scheme.validate(trs.asset.uiaAsset, {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 256
        },
        desc: {
          type: 'string',
          minLength: 1,
          maxLength: 4096
        },
        currency: {
          type: 'string',
          minLength: 3,
          maxLength: 30
        },
        category: {
          type: 'string',
          minLength: 1,
          maxLength: 30
        },
        maximum: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        precison: {
          type: 'integer',
          minimum: 0,
          maximum: 16
        },
        estimateUnit: {
          type: 'string',
          minLength: 3,
          maxLength: 3
        },
        estimatePrice: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        exerciseUnit: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        extra: {
          type: 'string',
          minLength: 1,
          maxLength: 4096
        },
        unlockCondition: {
          type: 'integer'
        }
      },
      required: ['name', 'desc', 'currency', 'category', 'maximum', 'precision', 'estimateUnit', 'estimatePrice', 'exerciseUnit', 'extra', 'unlockCondition']
    })

    if (!report) {
      throw Error('Can\'t parse transaction: ' + library.scheme.getLastError())
    }

    return trs
  }

  this.dbRead = function (raw) {
    if (!raw.assets_name) {
      return null
    } else {
      var asset = {
        transactionId: raw.t_id,
        name: raw.assets_name,
        desc: raw.assets_desc,
        category: raw.assets_category,
        currency: raw.assets_currency,
        maximum: raw.assets_maximum,
        precision: raw.assets_precision,
        estimateUnit: raw.assets_estimateUnit,
        estimatePrice: raw.assets_estimatePrice,
        exerciseUnit: raw.assets_exerciseUnit,
        extra: raw.assets_extra,
        unlockCondition: raw.assets_unlockCondition
      }

      return { uiaAsset: asset }
    }
  }

  this.dbSave = function (trs, cb) {
    var asset = trs.asset.uiaAsset
    var nameParts = asset.currency.split('.')
    var values = {
      transactionId: trs.id,
      issuerName: nameParts.length > 1 ? nameParts[0] : '__SYSTEM__',
      quantity: '0',
      approved: 0,
      name: asset.name,
      currency: asset.currency,
      desc: asset.desc,
      maximum: asset.maximum,
      precision: asset.precision,
      category: asset.category,
      estimateUnit: asset.estimateUnit,
      estimatePrice: asset.estimatePrice,
      exerciseUnit: asset.exerciseUnit,
      extra: asset.extra,
      unlockCondition: asset.unlockCondition
    }
    library.model.add('assets', values, cb)
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

module.exports = new Asset
