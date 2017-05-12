var util = require('util');
var ByteBuffer = require('bytebuffer');
var crypto = require('./crypto.js');
var bignum = require('browserify-bignum');

var bytesTypes = {
	2: function (trs) {
		try {
			var buf = new Buffer(trs.asset.delegate.username, 'utf8');
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	3: function (trs) {
		try {
			var buf = trs.asset.vote.votes ? new Buffer(trs.asset.vote.votes.join(''), 'utf8') : null;
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},

	5: function (trs) {
		try {
			var buf = new Buffer([]);
			var nameBuf = new Buffer(trs.asset.dapp.name, 'utf8');
			buf = Buffer.concat([buf, nameBuf]);

			if (trs.asset.dapp.description) {
				var descriptionBuf = new Buffer(trs.asset.dapp.description, 'utf8');
				buf = Buffer.concat([buf, descriptionBuf]);
			}

			if (trs.asset.dapp.git) {
				buf = Buffer.concat([buf, new Buffer(trs.asset.dapp.git, 'utf8')]);
			}

			var bb = new ByteBuffer(4 + 4, true);
			bb.writeInt(trs.asset.dapp.type);
			bb.writeInt(trs.asset.dapp.category);
			bb.flip();

			buf = Buffer.concat([buf, bb.toBuffer()]);
		} catch (e) {
			throw Error(e.toString());
		}

		return buf;
	},
	8: function (trs) {
		var buffer = Buffer.concat([
      Buffer.from([trs.asset.approval.topic]),
      new Buffer(trs.asset.approval.value, 'utf8')
    ])
    return buffer
	},
	9: function (trs) {
		var buffer = Buffer.concat([
      new Buffer(trs.asset.uiaIssuer.name, 'utf8'),
      new Buffer(trs.asset.uiaIssuer.desc, 'utf8')
    ])
    return buffer
	},
	10: function (trs) {
		var asset = trs.asset.uiaAsset;
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
    ]);
		return buffer
	},
	11: function (trs) {
		var buffer = Buffer.concat([
      new Buffer(trs.asset.uiaIssue.currency, 'utf8'),
      new Buffer(trs.asset.uiaIssue.amount, 'utf8'),
      new Buffer(trs.asset.uiaIssue.exchangeRate, 'utf8')
    ])
    return buffer
	}
}

function getTransactionBytes(trs, skipSignature) {
	var assetBytes, assetSize;

	if (trs.type > 0) {
		assetBytes = bytesTypes[trs.type](trs);
		assetSize = assetBytes ? assetBytes.length : 0;
	} else {
		assetSize = 0;
	}

	var bb = new ByteBuffer(1, true);
	bb.writeByte(trs.type);
	bb.writeInt(trs.timestamp);

	var senderPublicKeyBuffer = new Buffer(trs.senderPublicKey, 'hex');
	for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
		bb.writeByte(senderPublicKeyBuffer[i]);
	}

	bb.writeString(trs.recipientId || '0');

	bb.writeString(trs.amount);

	bb.writeString(trs.currency || '0')

	if (assetSize > 0) {
		for (var i = 0; i < assetSize; i++) {
			bb.writeByte(assetBytes[i]);
		}
	}

	if (!skipSignature && trs.signature) {
		var signatureBuffer = new Buffer(trs.signature, 'hex');
		for (var i = 0; i < signatureBuffer.length; i++) {
			bb.writeByte(signatureBuffer[i]);
		}
	}

	bb.flip();

	return bb.toBuffer();
}

module.exports = {
	getTransactionBytes: getTransactionBytes
}
