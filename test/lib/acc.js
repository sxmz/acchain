var crypto = require('crypto')
var bignum = require('bignumber')
var node = require('./../variables.js')
var DEBUG = require('debug')('acc')
var expect = node.expect
var AssetCategoryManager = require('../../src/utils/asset-category.js')
var sdrHelper = require('../../src/utils/sdr.js')
var numHelper = require('../../src/utils/number.js')

async function registerIssuerAsync(name, desc, account) {
  var res = await node.submitTransactionAsync(node.asch.uia.createIssuer(name, desc, account.password))
  DEBUG('register issuer response', res.body)
  return res
}

async function registerAssetAsync(data, account) {
  var res = await node.submitTransactionAsync(node.asch.uia.createAsset(data, account.password))
  DEBUG('register asset response', res.body)
  return res
}

async function issueAssetAsync(currency, amount, exchangeRate, account) {
  var res = await node.submitTransactionAsync(node.asch.uia.createIssue(currency, amount, exchangeRate, account.password))
  DEBUG('issue asset response', res.body)
  return res
}

async function approvalAsync(topic, value, account) {
  var res = await node.submitTransactionAsync(node.asch.uia.createApproval(currency, amount, account.password))
  DEBUG('issue asset response', res.body)
  return res
}

describe('acc', function () {
  describe('util test', function () {
    it('test asset category parsing', function (done) {
      var acm = new AssetCategoryManager
      var fileContent =
        '10,链层代币\n' +
        '1001,比特币\n' +
        '1002,莱特币\n' +
        '03,图书音像\n' +
        '0301,邮币\n' +
        '030101,邮票\n' +
        '0302,少儿\n' +
        '030205,绘本\n' +
        '04,服装\n' +
        '0401,女装\n' +
        '040101,女士上装\n' +
        '0401010002,牛仔服'

      acm.parse(fileContent)
      var rootCategories = acm.getChildren()
      node.expect(rootCategories).to.eql([
        { id: '10', attrs: ['链层代币'] },
        { id: '03', attrs: ['图书音像'] },
        { id: '04', attrs: ['服装'] },
      ])
      node.expect(acm.getChildren('10')).to.eql([
        { id: '1001', attrs: ['比特币'] },
        { id: '1002', attrs: ['莱特币'] }
      ])
      done()
    })

    it('test sdr currency', function (done) {
      node.expect(sdrHelper.isSdrCurrency('RMB')).to.be.ok
      node.expect(sdrHelper.isSdrCurrency('BTC')).to.not.be.ok
      done()
    })

    it('test number util', function (done) {
      node.expect(numHelper.isValidNumber(7, 0)).to.be.ok
      node.expect(numHelper.isValidNumber('7', 0)).to.not.be.ok
      node.expect(numHelper.isValidNumber(7.0, 0)).to.be.ok
      node.expect(numHelper.isValidNumber(7.0, 0)).to.be.ok
      node.expect(numHelper.isValidNumber(7.1, 1)).to.be.ok
      node.expect(numHelper.isValidNumber(7.12, 3)).to.not.be.ok
      node.expect(numHelper.isValidNumber(7.12, 1)).to.not.be.ok
      done()
    })
  })

  describe('asset issue test', function () {
    var ISSUER1 = {
      name: 'issuername',
      desc: 'issuer1_desc'
    }

    var ASSET1 = {
      name: '普洱茶',
      desc: 'asset1_desc',
      currency: 'issuername.PEB',
      maximum: '10000000000000',
      precision: 6,
      category: '010203',
      estimateUnit: 'RMB',
      estimatePrice: '20',
      exerciseUnit: '10',
      unlockCondition: 0,
      extra: 'extra information',
    }

    it('Get issuers should be ok', async function () {
      var res = await node.apiGetAsync('/uia/issuers')
      DEBUG('get /uia/issuers response', res.body)
      expect(res.body.count).to.be.a('number')
      expect(res.body.issuers).to.be.instanceOf(Array)
    })

    it('Register issuer should be ok', async function () {
      var trs = node.asch.uia.createIssuer(ISSUER1.name, ISSUER1.desc, node.Gaccount.password)
      DEBUG('create issuer trs', trs)
      var res = await node.submitTransactionAsync(trs)
      DEBUG('submit issuer response', res.body)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      var res = await node.apiGetAsync('/uia/issuers/' + ISSUER1.name)
      DEBUG('get /uia/issuers/:name response', res.body)
      expect(res.body).to.have.property('issuer')
      expect(res.body.issuer.name).to.equal(ISSUER1.name)
      expect(res.body.issuer.issuerId).to.equal(node.Gaccount.address)
    })

    it('Register asset should be ok', async function () {
      var trs = node.asch.uia.createAsset(ASSET1, node.Gaccount.password)
      DEBUG('create asset trs', trs)

      var res = await node.submitTransactionAsync(trs)
      DEBUG('submit asset response', res.body)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      res = await node.apiGetAsync('/uia/assets/applying')
      DEBUG('get /uia/assets/applying response', res.body)
      expect(res.body.count).to.be.a('number')
      expect(res.body.assets).to.be.instanceOf(Array)

      res = await node.apiGetAsync('/uia/assets/' + ASSET1.currency)
      DEBUG('get /uia/assets/:name response', res.body)
      expect(res.body.asset.name).to.equal(ASSET1.name)
      expect(res.body.asset.desc).to.equal(ASSET1.desc)
      expect(res.body.asset.maximum).to.equal(ASSET1.maximum)
      expect(res.body.asset.precision).to.equal(ASSET1.precision)
      expect(res.body.asset.issuerId).to.equal(node.Gaccount.address)
      expect(res.body.asset.quantity).to.equal('0')
    })

    it('Test asset approval', async function () {
      var trs = node.asch.uia.createApproval(1, ASSET1.currency, node.Gaccount.password)
      DEBUG('create asset approval trs', trs)

      var res = await node.submitTransactionAsync(trs)
      DEBUG('submit asset approval response', res.body)
      expect(res.body).to.have.property('success').to.be.false

      await node.onNewBlockAsync()

      var DELEGATE1 = {
        address: 'AKf97cJg1A6RYggbdi8XfGKHYHM5tgzh1C',
        password: 'spoon actual field sibling swamp theory float novel frown accuse media action'
      }
      await node.giveMoneyAndWaitAsync([DELEGATE1.address])

      res = await node.submitTransactionAsync(node.asch.uia.createApproval(1, ASSET1.currency, DELEGATE1.password))
      DEBUG('submit asset approval response 2', res.body)
      expect(res.body).to.have.property('success').to.be.true

      res = await node.apiGetAsync('/uia/assets/' + ASSET1.currency + '/voters')
      DEBUG('get asset voters response', res.body)
    })

    it('Asset should be approved if receive more than 2/3 votes', async function () {
      
    })
  })
})