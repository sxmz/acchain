var async = require('async')
var util = require('util')
var bignum = require('bignumber')
var jsonSql = require('json-sql')()
jsonSql.setDialect('sqlite')

class Model {
  constructor(dbLite) {
    this.dbLite = dbLite
  }

  exists(table, condition, cb) {
    this.count(table, condition, function (err, count) {
      if (err) return cb(err)
      cb(null, count > 0)
    })
  }

  count(table, condition, cb) {
    var sql = jsonSql.build({
      type: 'select',
      table: table,
      fields: ['count(*)'],
      condition: condition
    })
    sql.query = sql.query.replace(/"/g, '')
    this.dbLite.query(sql.query, sql.values, { count: Number }, function (err, rows) {
      if (err) return cb('Database error: ' + err)
      cb(null, rows[0].count)
    })
  }

  getIssuerByName(name, fields, cb) {
    var filter = {
      condition: { name: name }
    }
    this.getIssuers(filter, fields, function (err, issuers) {
      if (err) return cb(err)
      cb(null, issuers && issuers[0])
    })
  }

  getIssuerByAddress(address, fields, cb) {
    var filter = {
      condition: { issuerId: address }
    }
    this.getIssuers(filter, fields, function (err, issuers) {
      if (err) return cb(err)
      cb(null, issuers && issuers[0])
    })
  }

  getIssuers(filter, fields, cb) {
    var limit = (filter && filter.limit) || 100
    var offset = (filter && filter.offset) || 0
    var sql = jsonSql.build({
      type: 'select',
      table: 'issuers',
      condition: filter.condition,
      fields: fields,
      limit: filter.limit || 20,
      offset: filter.offset || 0
    })

    var fieldConv = {}
    fields.forEach((item) => {
      fieldConv[item] = String
    })
    this.dbLite.query(sql.query, sql.values, fieldConv, function (err, rows) {
      if (err) return cb('Database error: ' + err)
      cb(null, rows)
    })
  }

  // TODO(qingfeng) make it more generic
  add(table, values, cb) {
    var sql = jsonSql.build({
      type: 'insert',
      table: table,
      values: values
    })
    this.dbLite.query(sql.query, sql.values, cb)
  }

  getAssets(filter, cb) {
    var sql = jsonSql.build({
      table: 'assets',
      alias: 'a',
      condition: filter.condition,
      limit: filter.limit,
      offset: filter.offset,
      join: [{
        type: 'inner',
        table: 'issuers',
        alias: 'i',
        on: {
          'a.issuerName': 'i.name'
        }
      }, {
          type: 'inner',
          table: 'trs',
          alias: 't',
          on: {
            'a.transactionId': 't.id'
          }
        }, {
          type: 'inner',
          table: 'blocks',
          alias: 'b',
          on: {
            't.blockId': 'b.id'
          }
        }],
      fields: [
        { 'a.currency': 'currency' },
        { 'a.name': 'name' },
        { 'a.desc': 'desc' },
        { 'a.maximum': 'maximum' },
        { 'a.precision': 'precision' },
        { 'a.quantity': 'quantity' },
        { 'b.height': 'height' },
        { 'i.issuerId': 'issuerId' },
        { 'a.issuerName': 'issuerName' },
        { 'a.category': 'category' },
        { 'a.estimateUnit': 'estimateUnit' },
        { 'a.estimatePrice': 'estimatePrice' },
        { 'a.exerciseUnit': 'exerciseUnit' },
        { 'a.extra': 'extra' },
        { 'a.unlockCondition': 'unlockCondition' },
        { 'a.approved': 'approved' }
      ]
    })
    var fieldConv = {
      currency: String,
      name: String,
      desc: String,
      maximum: String,
      precision: Number,
      quantity: String,
      height: Number,
      issuerId: String,
      issuerName: String,
      category: String,
      estimateUnit: String,
      estimatePrice: String,
      exerciseUnit: String,
      extra: String,
      unlockCondition: Number,
      approved: Number
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, function (err, rows) {
      if (err) return cb('Database error: ' + err)
      cb(null, rows)
    })
  }

  getAssetByCurrency(currency, cb) {
    var filter = {
      condition: {
        'a.currency': currency
      }
    }
    this.getAssets(filter, function (err, assets) {
      if (err) return cb(err)
      return cb(null, assets && assets[0])
    })
  }

  addAssetQuantity(currency, amount, cb) {
    var sql = 'select quantity from assets where currency=$currency'
    this.dbLite.query(sql, { currency: currency }, { quantity: String }, (err, rows) => {
      if (err) return cb('Database error when query asset: ' + err)
      if (!rows || !rows.length) return cb('Asset not exists')
      var quantity = rows[0].quantity
      var sql = jsonSql.build({
        type: 'update',
        table: 'assets',
        condition: { currency: currency },
        modifier: {
          quantity: bignum(quantity).plus(amount).toString()
        }
      })
      this.dbLite.query(sql.query, sql.values, (err) => {
        if (err) return cb('Database error when update asset: ' + err)
        cb()
      })
    })
  }

  updateAssetBalance(currency, amount, address, cb) {
    var sql = 'select balance from mem_asset_balances where address=$address and currency=$currency'
    var condition = {
      address: address,
      currency: currency
    }
    this.dbLite.query(sql, condition, { balance: String }, (err, rows) => {
      if (err) return cb('Databae error when query asset balance: ' + err)
      var balance = '0'
      var balanceExist = false
      if (rows && rows.length > 0) {
        balance = rows[0].balance
        balanceExist = true
      }
      var newBalance = bignum(balance).plus(amount)
      if (newBalance.lt(0)) {
        return cb('Asset balance not enough')
      }
      var statement = {
        table: 'mem_asset_balances'
      }
      if (balanceExist) {
        statement.type = 'update'
        statement.condition = condition
        statement.modifier = { balance: newBalance.toString() }
      } else {
        statement.type = 'insert'
        statement.values = {
          address: address,
          balance: newBalance.toString(),
          currency: currency
        }
      }
      var sql = jsonSql.build(statement)
      this.dbLite.query(sql.query, sql.values, (err) => {
        if (err) return cb('Database error when updateBalance: ' + err)
        cb()
      })
    })
  }

  updateAssetFlag(currency, flag, flagName, cb) {
    var modifier = {}
    modifier[flagName] = flag
    var sql = jsonSql.build({
      type: 'update',
      table: 'assets',
      condition: {
        name: currency
      },
      modifier: modifier
    })
    this.dbLite.query(sql.query, sql.values, function (err) {
      if (err) return cb('Database error: ' + err)
      cb()
    })
  }

  getAssetAcl(table, currency, filter, cb) {
    var sql = jsonSql.build({
      type: 'select',
      table: table,
      condition: {
        currency: currency
      },
      fields: ['address'],
      limit: filter.limit,
      offset: filter.offset
    })
    this.dbLite.query(sql.query, sql.values, { address: String }, cb)
  }

  addAssetAcl(table, currency, list, cb) {
    var sqls = []
    for (var i = 0; i < list.length; ++i) {
      sqls.push(jsonSql.build({
        type: 'insert',
        or: 'ignore',
        table: table,
        values: {
          currency: currency,
          address: list[i]
        }
      }))
    }
    async.eachSeries(sqls, (sql, next) => {
      this.dbLite.query(sql.query, sql.values, next)
    }, cb)
  }

  removeAssetAcl(table, currency, list, cb) {
    var sql = jsonSql.build({
      type: 'remove',
      table: table,
      condition: [
        { currency: currency },
        { address: { $in: list } }
      ]
    })
    this.dbLite.query(sql.query, sql.values, cb)
  }

  getAllAssetBalances(cb) {
    var sql = jsonSql.build({
      type: 'select',
      table: 'mem_asset_balances',
      fields: ['currency', 'address', 'balance']
    })
    var fieldConv = {
      currency: String,
      address: String,
      balance: String
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, cb)
  }

  getAccountBalances(address, filter, cb) {
    var condition = {
      address: address
    }
    var limit
    var offset
    if (typeof filter === 'string') {
      condition.currency = filter
    } else {
      limit = filter.limit
      offset = filter.offset
    }
    var sql = jsonSql.build({
      type: 'select',
      condition: condition,
      limit: limit,
      offset: offset,
      table: 'mem_asset_balances',
      alias: 'b',
      join: [
        {
          type: 'inner',
          table: 'assets',
          alias: 'a',
          on: {
            'a.currency': 'b.currency'
          }
        }
      ],
      fields: {
        'b.currency': 'currency',
        'b.balance': 'balance',
        'a.precision': 'precision',
        'a.quantity': 'quantity',
        'a.name': 'name',
        'a.extra': 'extra'
      }
    })
    var fieldConv = {
      currency: String,
      balance: String,
      precision: Number,
      quantity: String,
      name: String,
      extra: String
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, cb)
  }

  checkAcl(table, currency, senderId, recipientId, cb) {
    var sql = 'select address from $table where address=$senderId and currency=$currency;' +
      'select address from $table where address=$recipientId and currency=$currency'
    var values = {
      table: table,
      senderId: senderId,
      recipientId: recipientId,
      currency: currency
    }
    this.dbLite.query(sql, values, function (err, res) {
      if (err) return cb(err)
      cb(null, res.length != 0)
    })
  }

  isIssuerExists(name, id, cb) {
    var sql = 'select name from issuers where name=$name;select name from issuers where issuerId=$id'
    var values = {
      name: name,
      id: id
    }
    this.dbLite.query(sql, values, ['name'], function (err, rows) {
      if (err) return cb('Database error: ' + err)
      cb(null, rows && rows.length > 0)
    })
  }

  getAllNativeBalances(cb) {
    var sql = jsonSql.build({
      type: 'select',
      table: 'mem_accounts',
      fields: ['address', 'balance']
    })
    var fieldConv = {
      address: String,
      balance: String
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, cb)
  }

  getApprovals(topic, value, filter, cb) {
    var options = {
      type: 'select',
      table: 'approvals',
      condition: {
        topic: topic,
        value: value
      },
      fields: ['senderId']
    }
    if (filter) {
      options.limit = filter.limit || 101
      options.offset = filter.offset || 0
    }
    var sql = jsonSql.build(options)
    var filedConv = { senderId: String }
    this.dbLite.query(sql.query, sql.values, filedConv, cb)
  }

  getAssetIssue(transactionId, cb) {
    var sql = jsonSql.build({
      type: 'select',
      condition: {
        'i.transactionId': transactionId
      },
      table: 'issues',
      alias: 'i',
      join: [
        {
          type: 'inner',
          table: 'assets',
          alias: 'a',
          on: {
            'a.currency': 'i.currency'
          }
        },
        {
          type: 'inner',
          table: 'trs',
          alias: 't',
          on: {
            't.id': 'i.transactionId'
          }
        }
      ],
      fields: {
        'i.currency': 'currency',
        'i.amount': 'amount',
        'a.precision': 'precision',
        'i.exchangeRate': 'exchangeRate',
        'i.approved2': 'approved',
        't.senderId': 'senderId'
      }
    })
    var fieldConv = {
      currency: String,
      amount: String,
      precision: Number,
      exchangeRate: String,
      approved: Number,
      senderId: String
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, function (err, rows) {
      if (err) return cb('Database error: ' + err)
      if (!rows || rows.length == 0) return cb('Issue transaction not found')
      return cb(null, rows[0])
    })
  }

  setAssetApproved(currency, val, cb) {
    var values = {
      currency: currency,
      approved: val
    }
    this.dbLite.query('update assets set approved = $approved where currency = $currency', values, cb)
  }

  setIssueApproved(transactionId, val, cb) {
    var values = {
      transactionId: transactionId,
      approved: val
    }
    this.dbLite.query('update issues set approved2 = $approved where transactionId = $transactionId', values, cb)
  }

  getIssues(filter, cb) {
    var sql = jsonSql.build({
      type: 'select',
      condition: filter.condition,
      limit: filter.limit,
      offset: filter.offset,
      table: 'issues',
      alias: 'i',
      join: [
        {
          type: 'inner',
          table: 'assets',
          alias: 'a',
          on: {
            'a.currency': 'i.currency'
          }
        },
        {
          type: 'inner',
          table: 'trs',
          alias: 't',
          on: {
            't.id': 'i.transactionId'
          }
        }
      ],
      fields: {
        'i.transactionId': 'transactionId',
        'i.currency': 'currency',
        'i.amount': 'amount',
        'a.precision': 'precision',
        'i.exchangeRate': 'exchangeRate',
        't.senderId': 'senderId',
        'i.approved2': 'approved'
      }
    })
    var fieldConv = {
      transactionId: String,
      currency: String,
      amount: String,
      precision: Number,
      exchangeRate: String,
      senderId: String,
      approved: Number
    }
    this.dbLite.query(sql.query, sql.values, fieldConv, cb)
  }

  updateKeyValue(table, key, value, cb) {
    var sql = util.format('update %s set value = value + %s where key = "%s"', table, value, key)
    this.dbLite.query(sql, cb)
  }

  getKeyValue(table, key, cb) {
    var sql = util.format('select value from %s where key = "%s"', table, key)
    this.dbLite.query(sql, function (err, rows) {
      if (err) return cb('Database error: ' + err)
      if (!rows || !rows.length) return cb('Key not found: ' + key)
      cb(null, rows[0][0])
    })
  }

  updateRewardPoolBalance(amount, cb) {
    this.updateKeyValue('map_bigint', 'REWARD_POOL_BALANCE', amount, cb)
  }

  getRewardPoolBalance(cb) {
    this.getKeyValue('map_bigint', 'REWARD_POOL_BALANCE', cb)
  }

  updateTotalAccQuantity(amount, cb) {
    this.updateKeyValue('map_bigint', 'TOTAL_ACC_QUANTITY', amount, cb)
  }

  getTotalAccQuantity(cb) {
    this.getKeyValue('map_bigint', 'TOTAL_ACC_QUANTITY', cb)
  }

  getTotalSupply(cb) {
    var sql = util.format('select value from %s where key = "%s";', 'map_bigint', 'TOTAL_ACC_QUANTITY')
    sql += util.format(';select value from %s where key = "%s"', 'map_bigint', 'REWARD_POOL_BALANCE')
    this.dbLite.query(sql, function (err, rows) {
      if (err) return cb('Datebase error: ' + err)
      if (!rows || rows.length < 2) return cb('Key not found')
      var totalSupply = bignum(rows[0]).sub(rows[1]).toString()
      cb(null, totalSupply)
    })
  }
}

module.exports = Model;