var assert = require('assert')
var async = require('async')
var bignum = require('bignumber')
var constants = require('../utils/constants.js')
var amountHelper = require('../utils/amount.js')
var numberHelper = require('../utils/number.js')
var assetHelper = require('./helper.js')
var slots = require('../utils/slots.js')

const TOPICS = {
  ASSET_REGISTER: 1,
  ASSET_ISSUE: 2
}

function getApprovalThreshold() {
  if (global.Config.netVersion === 'mainnet') {
    return Math.ceil(101 * 2 / 3)
  } else {
    return 5
  }
}

function calcRound(height) {
  return Math.floor(height / slots.delegates) + (height % slots.delegates > 0 ? 1 : 0);
}

function Approval() {
  this.create = function (data, trs) {
    trs.recipientId = null
    trs.amount = '0'
    trs.asset.approval = {
      topic: data.topic,
      value: data.value
    }
    return trs
  }

  this.calculateFee = function (trs, sender) {
    return 1 * constants.fixedPoint
  }

  this.verify = function (trs, sender, cb) {
    if (trs.recipientId) return setImmediate(cb, 'Invalid recipient')
    if (trs.amount != '0') return setImmediate(cb, 'Invalid transaction amount')

    if (!modules.delegates.isActiveDelegate(sender.address)) {
      return setImmediate(cb, 'Permission not allowed')
    }
    var topic = trs.asset.approval.topic
    if (topic < TOPICS.ASSET_REGISTER || topic > TOPICS.ASSET_ISSUE) {
      return setImmediate(cb, 'Invalid approval topic')
    }
    var value = trs.asset.approval.value
    if (topic === TOPICS.ASSET_ISSUE && value.length !== 64) {
      return setImmediate(cb, 'Invalid topic or value')
    }
    var condition = {
      senderId: sender.address,
      topic: topic,
      value: trs.asset.approval.value
    }
    library.model.exists('approvals', condition, function (err, exists) {
      if (err) return cb(err)
      if (exists) return cb('Approval already exists')

      // TODO check asset if exists if topic is asset register
      cb()
    })
  }

  this.process = function (trs, sender, cb) {
    setImmediate(cb, null, trs)
  }

  this.getBytes = function (trs) {
    var buffer = Buffer.concat([
      Buffer.from([trs.asset.approval.topic]),
      new Buffer(trs.asset.approval.value, 'utf8')
    ])
    return buffer
  }

  this.apply = function (trs, block, sender, cb) {
    var topic = trs.asset.approval.topic
    var value = trs.asset.approval.value
    var memKey = trs.type + ':' + topic + ':' + value
    var memCount = library.oneoff.get(memKey) || 0
    memCount += 1
    library.oneoff.set(memKey, memCount)
    library.model.getApprovals(topic, value, null, function (err, approvals) {
      if (err) return cb('Failed to get approvals: ' + err)
      // don't verify approvals in genesisblock
      if (block.height !== 1) {
        var activeVote = memCount
        for (var i = 0; i < approvals.length; ++i) {
          if (modules.delegates.isActiveDelegate(approvals[i].senderId)) {
            activeVote += 1
          }
        }
        if (activeVote !== getApprovalThreshold()) return cb()
      }
      if (topic === TOPICS.ASSET_REGISTER) {
        var currency = value
        library.model.setAssetApproved(currency, 1, cb)
      } else if (topic === TOPICS.ASSET_ISSUE) {
        // TODO fix the callback hell problem
        var transactionId = value
        library.model.getAssetIssue(transactionId, function (err, issue) {
          if (err) return cb('Failed to get asset issue: ' + err)
          if (issue.approved) return cb()
          var diffPrecision = 6 - issue.precision
          var unlockAccAmount = bignum(issue.amount).mul(issue.exchangeRate).mul(Math.pow(10, diffPrecision)).toString()
          var lockAccAmount = bignum(issue.amount).mul(issue.exchangeRate).mul(Math.pow(10, diffPrecision)).mul(0.25).toString()
          library.model.getTotalAccQuantity(function (err, totalAccQuantity) {
            if (err) return cb('Failed to get acc quantity: ' + err)
            if (bignum(unlockAccAmount).plus(lockAccAmount).plus(totalAccQuantity).gt(constants.totalAmount)) {
              return cb('ACC over limit')
            }
            library.model.setIssueApproved(transactionId, 1, function (err) {
              if (err) return cb('Failed to set issue approved' + err)
              library.model.addAssetQuantity(issue.currency, issue.amount, function (err) {
                if (err) return cb('Failed to add asset quantity: ' + err)
                if (assetHelper.isChainLevelToken(issue.currency)) {
                  library.balanceCache.addAssetBalance(constants.assetAccount, issue.currency, issue.amount)
                  library.model.updateAssetBalance(issue.currency, issue.amount, constants.assetAccount, function (err) {
                    if (err) return cb('Failed to update asset balance: ' + err)
                    var diff1 = {
                      balance: unlockAccAmount,
                      u_balance: unlockAccAmount,
                      round: calcRound(block.height),
                      blockId: block.id,
                    }
                    library.base.account.merge(issue.senderId, diff1, function (err) {
                      if (err) return cb('Failed to merge account: ' + err)
                      library.model.updateRewardPoolBalance(lockAccAmount, function (err) {
                        if (err) return cb('Failed to update prize pool balance: ' + err)
                        var newCreatedAmount = bignum(unlockAccAmount).plus(lockAccAmount).toString()
                        library.model.updateTotalAccQuantity(newCreatedAmount, cb)
                      })
                    })
                  })
                } else {
                  library.balanceCache.addAssetBalance(issue.senderId, issue.currency, issue.amount)
                  library.model.updateAssetBalance(issue.currency, issue.amount, issue.senderId, cb)
                }
              })
            });
          })
        })
      }
    })
  }

  this.undo = function (trs, block, sender, cb) {
    var topic = trs.asset.approval.topic
    var value = trs.asset.approval.value
    var memKey = trs.type + ':' + topic + ':' + value
    var memCount = library.oneoff.get(memKey) || 0
    memCount -= 1
    library.oneoff.set(memKey, memCount)
    library.model.getApprovals(topic, value, null, function (err, approvals) {
      if (err) return cb('Failed to get approvals: ' + err)
      var activeVote = memCount + 1
      for (var i = 0; i < approvals.length; ++i) {
        if (modules.delegates.isActiveDelegate(approvals[i].senderId)) {
          activeVote += 1
        }
      }
      if (activeVote !== getApprovalThreshold()) return cb()
      if (topic === TOPICS.ASSET_REGISTER) {
        var currency = value
        library.model.setAssetApproved(currency, 0, cb)
      } else if (topic === TOPICS.ASSET_ISSUE) {
        var transactionId = value
        library.model.getAssetIssue(transactionId, function (err, issue) {
          if (err) cb('Failed to get asset issue: ' + err)
          var diffPrecision = 6 - issue.precision
          var unlockAccAmount = bignum(issue.amount).mul(issue.exchangeRate).mul(Math.pow(10, diffPrecision)).toString()
          var lockAccAmount = bignum(issue.amount).mul(issue.exchangeRate).mul(Math.pow(10, diffPrecision)).mul(0.25).toString()
          library.model.setIssueApproved(transactionId, 0, function (err) {
            if (err) return cb('Failed to set issue approved' + err)
            library.model.addAssetQuantity(issue.currency, '-' + issue.amount, function (err) {
              if (err) return cb('Failed to add asset quantity: ' + err)
              if (assetHelper.isChainLevelToken(issue.currency)) {
                library.balanceCache.addAssetBalance(constants.assetAccount, issue.currency, '-' + issue.amount)
                library.model.updateAssetBalance(issue.currency, '-' + issue.amount, constants.assetAccount, function (err) {
                  if (err) return cb('Failed to update asset balance: ' + err)
                  var diff1 = {
                    balance: '-' + unlockAccAmount,
                    u_balance: '-' + unlockAccAmount,
                    round: calcRound(block.height),
                    blockId: block.id,
                  }
                  library.base.account.merge(issue.senderId, diff1, function (err) {
                    if (err) return cb('Failed to merge account: ' + err)
                    library.model.updateRewardPoolBalance('-' + lockAccAmount, function (err) {
                      if (err) return cb('Failed to update prize pool balance: ' + err)
                      var newCreatedAmount = '-' + bignum(unlockAccAmount).plus(lockAccAmount).toString()
                      library.model.updateTotalAccQuantity(newCreatedAmount, cb)
                    })
                  })
                })
              } else {
                library.balanceCache.addAssetBalance(issue.senderId, '-' + issue.currency, issue.amount)
                library.model.updateAssetBalance(issue.currency, '-' + issue.amount, issue.senderId, cb)
              }
            })
          });
        })
      }
    })
  }

  this.applyUnconfirmed = function (trs, sender, cb) {
    var key = trs.senderId + ':' + trs.asset.approval.topic + ':' + trs.asset.approval.value + ':' + trs.type
    if (library.oneoff.has(key)) {
      return setImmediate(cb, 'Double submit')
    }
    library.oneoff.set(key, true)
    setImmediate(cb)
  }

  this.undoUnconfirmed = function (trs, sender, cb) {
    var key = trs.senderId + ':' + trs.asset.approval.topic + ':' + trs.asset.approval.value + ':' + trs.type
    library.oneoff.delete(key)
    setImmediate(cb)
  }

  this.objectNormalize = function (trs) {
    var report = library.scheme.validate(trs.asset.approval, {
      type: 'object',
      properties: {
        topic: {
          type: 'integer',
        },
        value: {
          type: 'string',
          minLength: 1,
          maxLength: 256
        }
      },
      required: ['topic', 'value']
    })

    if (!report) {
      throw Error('Can\'t parse transaction: ' + library.scheme.getLastError())
    }

    return trs
  }

  this.dbRead = function (raw) {
    if (!raw.approvals_topic) {
      return null
    } else {
      var asset = {
        transactionId: raw.t_id,
        topic: raw.approvals_topic,
        value: raw.approvals_value
      }

      return { approval: asset }
    }
  }

  this.dbSave = function (trs, cb) {
    var values = {
      transactionId: trs.id,
      senderId: trs.senderId,
      topic: trs.asset.approval.topic,
      value: trs.asset.approval.value
    }
    library.model.add('approvals', values, cb)
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

module.exports = new Approval