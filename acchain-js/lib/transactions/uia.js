var ByteBuffer = require('bytebuffer')
var crypto = require("./crypto.js")
var constants = require("../constants.js")
var slots = require("../time/slots.js")

function getClientFixedTime() {
  return slots.getTime() - constants.clientDriftSeconds
}

function toLocalBuffer(buf) {
  if (typeof window !== 'undefined') {
    return new Uint8Array(buf.toArrayBuffer())
  } else {
    return buf.toBuffer()
  }
}

function createTransaction(asset, bytes, fee, type, recipientId, message, secret, secondSecret) {
  var keys = crypto.getKeys(secret)

  var transaction = {
    type: type,
    amount: '0',
    fee: fee,
    recipientId: recipientId,
    senderPublicKey: keys.publicKey,
    timestamp: getClientFixedTime(),
    message: message,
    asset: asset,
    __assetBytes__: bytes
  }

  crypto.sign(transaction, keys)

  if (secondSecret) {
    var secondKeys = crypto.getKeys(secondSecret)
    crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = crypto.getId(transaction)
  delete transaction.__assetBytes__

  return transaction
}

module.exports = {
  createIssuer: function (name, desc, secret, secondSecret) {
    var asset = {
      uiaIssuer: {
        name: name,
        desc: desc
      }
    }
    var bb = new ByteBuffer(1, true)
    bb.writeString(name)
    bb.writeString(desc)
    bb.flip()
    var bytes = toLocalBuffer(bb)
    //var fee = (100 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.coin
    var fee = 100 * constants.coin
    return createTransaction(asset, bytes, fee, 9, null, null, secret, secondSecret)
  },

  createAsset: function (data, secret, secondSecret) {
    var asset = {
      uiaAsset: {
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
    }
    var bb = new ByteBuffer(1, true)
    bb.writeString(data.name)
    bb.writeString(data.currency)
    bb.writeString(data.desc)
    bb.writeString(data.category)
    bb.writeString(data.maximum)
    bb.writeByte(data.precision)
    bb.writeString(data.estimateUnit)
    bb.writeString(data.estimatePrice)
    bb.writeString(data.exerciseUnit)
    bb.writeString(data.extra)
    bb.writeByte(data.unlockCondition)
    bb.flip()
    var bytes = toLocalBuffer(bb)
    // var fee = (500 + (Math.floor(bytes.length / 200) + 1) * 0.1) * constants.coin
    var fee = 10 * constants.coin
    return createTransaction(asset, bytes, fee, 10, null, null, secret, secondSecret)
  },

  createIssue: function (currency, amount, exchangeRate, secret, secondSecret) {
    var asset = {
      uiaIssue: {
        currency: currency,
        amount: amount,
        exchangeRate: exchangeRate
      }
    }
    var bb = new ByteBuffer(1, true)
    bb.writeString(currency)
    bb.writeString(amount)
    bb.writeString(exchangeRate)
    bb.flip()
    var bytes = toLocalBuffer(bb)
    var fee = 100 * constants.coin
    return createTransaction(asset, bytes, fee, 11, null, null, secret, secondSecret)
  },

  createApproval: function (topic, value, secret, secondSecret) {
    var asset = {
      approval: {
        topic: topic,
        value: value
      }
    }
    var bb = new ByteBuffer(1, true)
    bb.writeByte(topic)
    bb.writeString(value)
    bb.flip()
    var bytes = toLocalBuffer(bb)
    var fee = 1 * constants.coin
    return createTransaction(asset, bytes, fee, 8, null, null, secret, secondSecret)
  },

  createExercise: function (currency, amount, message, secret, secondSecret) {
    var asset = {
      uiaExercise: {
        currency: currency,
        amount: amount
      }
    }
    var bb = new ByteBuffer(1, true)
    bb.writeString(currency)
    bb.writeString(amount)
    bb.flip()
    var bytes = toLocalBuffer(bb)
    var fee = 0.1 * constants.coin
    return createTransaction(asset, bytes, fee, 12, null, message, secret, secondSecret)
  },
}
