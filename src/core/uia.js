var ByteBuffer = require('bytebuffer')
var bignum = require('bignumber')
var crypto = require('crypto')
var async = require('async')
var ed = require('ed25519')
var extend = require('extend')
var jsonSql = require('json-sql')()
jsonSql.setDialect('sqlite')
var constants = require('../utils/constants.js')
var slots = require('../utils/slots.js')
var Router = require('../utils/router.js')
var TransactionTypes = require('../utils/transaction-types.js')
var sandboxHelper = require('../utils/sandbox.js')
var addressHelper = require('../utils/address.js')

// Private fields
var modules, library, self, private = {}, shared = {}

// Constructor
function UIA(cb, scope) {
  library = scope
  self = this
  self.__private = private
  private.attachApi()

  library.base.transaction.attachAssetType(TransactionTypes.APPROVAL, require('../uia/approval.js'))
  library.base.transaction.attachAssetType(TransactionTypes.UIA_ISSUER, require('../uia/issuer.js'))
  library.base.transaction.attachAssetType(TransactionTypes.UIA_ASSET, require('../uia/asset.js'))
  library.base.transaction.attachAssetType(TransactionTypes.UIA_ISSUE, require('../uia/issue.js'))
  library.base.transaction.attachAssetType(TransactionTypes.UIA_EXERCISE, require('../uia/exercise.js'))

  library.model.getAllAssetBalances((err, results) => {
    if (err) return cb('Failed to load asset balances: ' + err)
    for (let i = 0; i < results.length; ++i) {
      let {currency, address, balance} = results[i]
      library.balanceCache.setAssetBalance(address, currency, balance)
    }
    library.balanceCache.commit()
    cb(null, self)
  })
}

// Private methods
private.attachApi = function () {
  var router = new Router()

  router.use(function (req, res, next) {
    if (modules) return next()
    res.status(500).send({ success: false, error: 'Blockchain is loading' })
  })

  router.map(shared, {
    'get /issuers': 'getIssuers',
    'get /issuers/:name': 'getIssuer',
    'get /issuers/:name/assets': 'getIssuerAssets',
    'get /assets': 'getAssets',
    'get /assets/applying': 'getApplyingAssets',
    'get /assets/approved': 'getApprovedAssets',
    'get /assets/:currency': 'getAsset',
    'get /balances/:address': 'getBalances',
    'get /balances/:address/:currency': 'getBalance',

    // 'get /supportedEstimateUnits': 'getSupportedEstimateUnits',
    'get /categories/:id': 'getCategories',
    'get /assets/:currency/voters': 'getAssetVoters',
    'get /issues': 'getIssues',
    'get /issues/applying': 'getApplyingIssues',
    'get /issues/approved': 'getApprovedIssues',
    'get /issues/:id/voters': 'getIssueVoters',
    'get /exercises': 'getExercises',

    'put /exercises': 'exerciseAsset',
    // 'put /issuers': 'registerIssuer',
    // 'put /assets': 'registerAssets',
    // 'put /assets/:name/issue': 'issueAsset',
    // 'put /approvals': 'submitApproval',
  })

  router.use(function (req, res, next) {
    res.status(500).send({ success: false, error: 'API endpoint not found' })
  })

  library.network.app.use('/api/uia', router)
  library.network.app.use(function (err, req, res, next) {
    if (!err) return next()
    library.logger.error(req.url, err.toString())
    res.status(500).send({ success: false, error: err.toString() })
  })
}

// Public methods
UIA.prototype.sandboxApi = function (call, args, cb) {
  sandboxHelper.callMethod(shared, call, args, cb)
}

// Events
UIA.prototype.onBind = function (scope) {
  modules = scope
}

// Shared
shared.getFee = function (req, cb) {
  var fee = null

  // FIXME(qingfeng)
  fee = 5 * constants.fixedPoint

  cb(null, { fee: fee })
}

shared.getIssuers = function (req, cb) {
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    library.model.count('issuers', null, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)

      library.model.getIssuers(query, ['name', 'desc', 'issuerId'], function (err, results) {
        if (err) return cb('Failed to get issuers: ' + err)

        cb(null, {
          issuers: results,
          count: count
        })
      })
    })
  })
}

shared.getIssuerByAddress = function (req, cb) {
  if (!req.params || !addressHelper.isAddress(req.params.address)) {
    return cb('Invalid address')
  }
  library.model.getIssuerByAddress(req.params.address, ['name', 'desc'], function (err, issuer) {
    if (err) return cb('Database error: ' + err)
    if (!issuer) return cb('Issuer not found')
    cb(null, { issuer: issuer })
  })
}

shared.getIssuer = function (req, cb) {
  if (req.params && addressHelper.isAddress(req.params.name)) {
    req.params.address = req.params.name
    return shared.getIssuerByAddress(req, cb)
  }
  var query = req.params
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 16
      }
    },
    required: ['name']
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    library.model.getIssuerByName(query.name, ['name', 'desc', 'issuerId'], function (err, issuer) {
      if (!issuer || err) return cb('Issuer not found')
      cb(null, { issuer: issuer })
    })
  })
}

shared.getIssuerAssets = function (req, cb) {
  if (!req.params || !req.params.name || req.params.name.length > 32) {
    return cb(' Invalid parameters')
  }
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    library.model.count('assets', { issuerName: req.params.name }, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)

      var filter = {
        condition: { issuerName: req.params.name },
        limit: query.limit,
        offset: query.offset
      }
      library.model.getAssets(filter, function (err, results) {
        if (err) return cb('Failed to get assets: ' + err)

        cb(null, {
          assets: results,
          count: count
        })
      })
    })
  })
}

shared.getApplyingAssets = function (req, cb) {
  req.body.approved = 0
  shared.getAssets(req, cb)
}

shared.getApprovedAssets = function (req, cb) {
  req.body.approved = 1
  shared.getAssets(req, cb)
}

shared.getAssets = function (req, cb) {
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      },
      approved: {
        type: 'integer',
        minimum: 0,
        maximum: 1
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    var condition = null
    if (typeof query.approved === 'number') {
      condition = { approved: query.approved }
    }
    library.model.count('assets', condition, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)

      var filter = {
        limit: query.limit,
        offset: query.offset,
        condition: condition
      }
      library.model.getAssets(filter, function (err, results) {
        if (err) return cb('Failed to get assets: ' + err)

        cb(null, {
          assets: results,
          count: count
        })
      })
    })
  })
}

shared.getAsset = function (req, cb) {
  var query = req.params
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
        minLength: 1,
        maxLength: 32
      }
    },
    required: ['currency']
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    library.model.getAssetByCurrency(query.currency, function (err, asset) {
      if (err) return cb('Failed to get asset: ' + err)
      if (!asset) return cb('Asset not found')
      cb(null, { asset: asset })
    })
  })
}

shared.getBalances = function (req, cb) {
  if (!req.params || !addressHelper.isAddress(req.params.address)) {
    return cb('Invalid address')
  }
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])

    var condition = {
      address: req.params.address
    }
    library.model.count('mem_asset_balances', condition, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)

      var filter = {
        limit: query.limit,
        offset: query.offset
      }
      library.model.getAccountBalances(req.params.address, filter, function (err, results) {
        if (err) return cb('Failed to get balances: ' + err)

        cb(null, {
          balances: results,
          count: count
        })
      })
    })
  })
}

shared.getBalance = function (req, cb) {
  if (!req.params) return cb('Invalid parameters')
  if (!addressHelper.isAddress(req.params.address)) return cb('Invalid address')
  if (!req.params.currency || req.params.currency.length > 22) return cb('Invalid currency')

  library.model.getAccountBalances(req.params.address, req.params.currency, function (err, results) {
    if (err) return cb('Failed to get balance: ' + err)
    if (!results || results.length == 0) return cb('Balance info not found')
    cb(null, { balance: results[0] })
  })
}

shared.getCategories = function (req, cb) {
  if (!req.params) return cb('Invalid parameters')
  var categories = library.assetCategoryManager.getChildren(req.params.id === '0' ? null : req.params.id)
  cb(null, { categories: categories })
}

shared.getAssetVoters = function (req, cb) {
  if (!req.params) return cb('Invalid parameters')
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])
    var filter = {
      limit: query.limit || 100,
      offset: query.offset || 0
    }
    library.model.count('approvals', { topic: 1, value: req.params.currency }, function (err, count) {
      if (err) return cb('Failed to get approval count')
      library.model.getApprovals(1, req.params.currency, filter, function (err, voters) {
        if (err) cb('Failed to get asset voters')
        var results = []
        for (var i = 0; i < voters.length; ++i) {
          results.push({
            voter: voters[i].senderId,
            weight: 1
          })
        }
        cb(null, {
          count: count,
          voters: results
        })
      })
    })
  })
}

shared.getIssueVoters = function (req, cb) {
  if (!req.params) return cb('Invalid parameters')
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])
    var filter = {
      limit: query.limit || 100,
      offset: query.offset || 0
    }
    library.model.count('approvals', { topic: 1, value: req.params.currency }, function (err, count) {
      if (err) return cb('Failed to get approval count')
      library.model.getApprovals(2, req.params.id, filter, function (err, voters) {
        if (err) cb('Failed to get asset voters')
        var results = []
        for (var i = 0; i < voters.length; ++i) {
          results.push({
            voter: voters[i].senderId,
            weight: 1
          })
        }
        cb(null, {
          count: count,
          voters: results
        })
      })
    })
  })
}

shared.getApplyingIssues = function (req, cb) {
  var query = req.body
  query.approved = 0
  shared.getIssues(req, cb)
}

shared.getApprovedIssues = function (req, cb) {
  var query = req.body
  query.approved = 1
  shared.getIssues(req, cb)
}

shared.getIssues = function (req, cb) {
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      },
      approved: {
        type: 'integer',
        minimum: 0,
        maximum: 1
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])
    var condition = null
    if (typeof query.approved === 'number') {
      condition = { approved2: query.approved }
    }
    library.model.count('issues', condition, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)


      var filter = {
        condition: condition,
        limit: query.limit,
        offset: query.offset
      }
      library.model.getIssues(filter, function (err, results) {
        if (err) return cb('Failed to get issues: ' + err)

        cb(null, {
          issues: results,
          count: count
        })
      })
    })
  })
}

shared.getExercises = function (req, cb) {
  var query = req.body
  library.scheme.validate(query, {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      },
      currency: {
        type: 'string',
        maxLength: 30
      },
      id: {
        type: 'string',
        maxLength: 64
      }
    }
  }, function (err) {
    if (err) return cb('Invalid parameters: ' + err[0])
    var condition = null
    if (typeof query.currency !== 'undefined') {
      condition = { currency2: query.currency }
    }
    if (typeof query.id !== 'undefined') {
      condition = { transactionId: query.id }
    }
    library.model.count('exercises', condition, function (err, count) {
      if (err) return cb('Failed to get count: ' + err)


      var filter = {
        condition: condition,
        limit: query.limit,
        offset: query.offset
      }
      library.model.getExercises(filter, function (err, results) {
        if (err) return cb('Failed to get exercises: ' + err)

        cb(null, {
          exercises: results,
          count: count
        })
      })
    })
  })
}

shared.exerciseAsset = function (req, cb) {
  var body = req.body;
  library.scheme.validate(body, {
    type: "object",
    properties: {
      secret: {
        type: 'string',
        minLength: 1
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      secondSecret: {
        type: 'string',
        minLength: 1
      },
      amount: {
        type: 'string',
        maxLength: 50
      },
      currency: {
        type: 'string',
        maxLength: 30
      }
    }
  }, function (err) {
    if (err) {
      return cb(err[0].message);
    }

    var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
    var keypair = ed.MakeKeypair(hash);

    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') != body.publicKey) {
        return cb("Invalid passphrase");
      }
    }

    library.balancesSequence.add(function (cb) {
      if (body.multisigAccountPublicKey && body.multisigAccountPublicKey != keypair.publicKey.toString('hex')) {
        modules.accounts.getAccount({ publicKey: body.multisigAccountPublicKey }, function (err, account) {
          if (err) {
            return cb(err.toString());
          }

          if (!account || !account.publicKey) {
            return cb("Multisignature account not found");
          }

          if (!account.multisignatures || !account.multisignatures) {
            return cb("Account does not have multisignatures enabled");
          }

          if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
            return cb("Account does not belong to multisignature group");
          }

          modules.accounts.getAccount({ publicKey: keypair.publicKey }, function (err, requester) {
            if (err) {
              return cb(err.toString());
            }

            if (!requester || !requester.publicKey) {
              return cb("Invalid requester");
            }

            if (requester.secondSignature && !body.secondSecret) {
              return cb("Invalid second passphrase");
            }

            if (requester.publicKey == account.publicKey) {
              return cb("Invalid requester");
            }

            var secondKeypair = null;

            if (requester.secondSignature) {
              var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
              secondKeypair = ed.MakeKeypair(secondHash);
            }

            try {
              var transaction = library.base.transaction.create({
                type: TransactionTypes.UIA_EXERCISE,
                currency: body.currency,
                amount: body.amount,
                sender: account,
                keypair: keypair,
                secondKeypair: secondKeypair,
                requester: keypair
              });
            } catch (e) {
              return cb(e.toString());
            }
            modules.transactions.receiveTransactions([transaction], cb);
          });
        });
      } else {
        modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
          if (err) {
            return cb(err.toString());
          }
          if (!account || !account.publicKey) {
            return cb("Account not found");
          }

          if (account.secondSignature && !body.secondSecret) {
            return cb("Invalid second passphrase");
          }

          var secondKeypair = null;

          if (account.secondSignature) {
            var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
            secondKeypair = ed.MakeKeypair(secondHash);
          }

          try {
            var transaction = library.base.transaction.create({
              type: TransactionTypes.UIA_EXERCISE,
              currency: body.currency,
              amount: body.amount,
              sender: account,
              keypair: keypair,
              secondKeypair: secondKeypair
            });
          } catch (e) {
            return cb(e.toString());
          }
          modules.transactions.receiveTransactions([transaction], cb);
        });
      }
    }, function (err, transaction) {
      if (err) {
        return cb(err.toString());
      }

      cb(null, { transaction: transaction[0] });
    });
  });
}

module.exports = UIA