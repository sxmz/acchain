var crypto = require('crypto');
var fs = require('fs');
var cryptoLib = require('../lib/crypto.js');
var transactionsLib = require('../lib/transactions.js');
var accounts = require('./account.js');
var ByteBuffer = require('bytebuffer');

var sender = accounts.account(cryptoLib.generateSecret());

function getBytes(block) {
	var size = 4 + 4 + 8 + 4 + 8 + 8 + 8 + 4 + 32 + 32 + 64;

	var bb = new ByteBuffer(size, true);
	bb.writeInt(block.version);
	bb.writeInt(block.timestamp);

	if (block.previousBlock) {
		bb.writeString(block.previousBlock)
	} else {
		bb.writeString('0')
	}

	bb.writeInt(block.numberOfTransactions);
	bb.writeLong(block.totalFee);
	bb.writeLong(block.reward);

	bb.writeInt(block.payloadLength);

	var payloadHashBuffer = new Buffer(block.payloadHash, 'hex');
	for (var i = 0; i < payloadHashBuffer.length; i++) {
		bb.writeByte(payloadHashBuffer[i]);
	}

	var generatorPublicKeyBuffer = new Buffer(block.generatorPublicKey, 'hex');
	for (var i = 0; i < generatorPublicKeyBuffer.length; i++) {
		bb.writeByte(generatorPublicKeyBuffer[i]);
	}

	if (block.blockSignature) {
		var blockSignatureBuffer = new Buffer(block.blockSignature, 'hex');
		for (var i = 0; i < blockSignatureBuffer.length; i++) {
			bb.writeByte(blockSignatureBuffer[i]);
		}
	}

	bb.flip();
	var b = bb.toBuffer();

	return b;
}

function signTransaction(keypair, trs) {
		var bytes = transactionsLib.getTransactionBytes(trs);
		trs.signature = cryptoLib.sign(keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(trs);
		trs.id = cryptoLib.getId(bytes);
		return trs
}

module.exports = {
	new: function (genesisAccount, dapp, accountsFile) {
		var payloadLength = 0,
			payloadHash = crypto.createHash('sha256'),
			transactions = [],
			delegates = [];

		// fund recipient account
		// if (accountsFile && fs.existsSync(accountsFile)) {
		// 	var lines = fs.readFileSync(accountsFile, 'utf8').split('\n');
		// 	for (var i in lines) {
		// 		var parts = lines[i].split('\t');
		// 		if (parts.length != 2) {
		// 			console.error('Invalid recipient balance format');
		// 			process.exit(1);
		// 		}
		// 		var trs = {
		// 			type: 0,
		// 			amount: Number(parts[1]) * 100000000,
		// 			fee: 0,
		// 			timestamp: 0,
		// 			recipientId: parts[0],
		// 			senderId: sender.address,
		// 			senderPublicKey: sender.keypair.publicKey
		// 		};

		// 		var bytes = transactionsLib.getTransactionBytes(trs);
		// 		trs.signature = cryptoLib.sign(sender.keypair, bytes);
		// 		bytes = transactionsLib.getTransactionBytes(trs);
		// 		trs.id = cryptoLib.getId(bytes);

		// 		transactions.push(trs);
		// 	}
		// } else {
		// 	var balanceTransaction = {
		// 		type: 0,
		// 		amount: '1000000000',
		// 		fee: 0,
		// 		timestamp: 0,
		// 		recipientId: genesisAccount.address,
		// 		senderId: sender.address,
		// 		senderPublicKey: sender.keypair.publicKey
		// 	};

		// 	var bytes = transactionsLib.getTransactionBytes(balanceTransaction);
		// 	balanceTransaction.signature = cryptoLib.sign(sender.keypair, bytes);
		// 	bytes = transactionsLib.getTransactionBytes(balanceTransaction);
		// 	balanceTransaction.id = cryptoLib.getId(bytes);

		// 	transactions.push(balanceTransaction);
		// }

		// make delegates
		for (var i = 0; i < 101; i++) {
			var delegate = accounts.account(cryptoLib.generateSecret());
			delegates.push(delegate);

			var username = "virtual_delegate_" + (i + 1);

			var transaction = {
				type: 2,
				amount: '0',
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: delegate.address,
				senderPublicKey: delegate.keypair.publicKey,
				asset: {
					delegate: {
						username: username
					}
				}
			}

			transactions.push(signTransaction(delegate.keypair, transaction));
		}

		// make votes
		var votes = delegates.map(function (delegate) {
			return "+" + delegate.keypair.publicKey;
		});

		var voteTransaction = {
			type: 3,
			amount: '0',
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				vote: {
					votes: votes
				}
			}
		}

		transactions.push(signTransaction(genesisAccount.keypair, voteTransaction));

		var registerIssuerTransaction = signTransaction(genesisAccount.keypair, {
			type: 9,
			amount: '0',
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				uiaIssuer: {
					name: '__SYSTEM__',
					desc: 'Virtual issuer registered by genesis account, which is used to issue chain level tokens'
				}
			}
		})
		transactions.push(registerIssuerTransaction)

		var registerAssetTransaction = signTransaction(genesisAccount.keypair, {
			type: 10,
			amount: '0',
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				uiaAsset: {
					name: 'Bitcoin',
					desc: 'Bitcoin is a cryptocurrency and a digital payment system invented by an unknown programmer, or a group of programmers, under the name Satoshi Nakamoto. It was released as open-source software in 2009',
					currency: 'BTC',
					maximum: '21000000000000',
					precision: 6,
					category: '1801',
					estimateUnit: 'RMB',
					estimatePrice: '8000',
					exerciseUnit: '1',
					unlockCondition: 0,
					extra: 'No extra information',
				}
			}
		})
		transactions.push(registerAssetTransaction)

		delegates.map(function (delegate) {
			transactions.push(signTransaction(delegate.keypair, {
				type: 8,
				amount: '0',
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: delegate.address,
				senderPublicKey: delegate.keypair.publicKey,
				asset: {
					approval: {
						topic: 1,
						value: 'BTC'
					}
				}
			}));
		})

		var issueAssetTransaction = signTransaction(genesisAccount.keypair, {
			type: 11,
			amount: '0',
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				uiaIssue: {
					currency: 'BTC',
					amount: '50000000000',
					exchangeRate: '10000'
				}
			}
		})
		transactions.push(issueAssetTransaction)

		delegates.map(function (delegate) {
			transactions.push(signTransaction(delegate.keypair, {
				type: 8,
				amount: '0',
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: delegate.address,
				senderPublicKey: delegate.keypair.publicKey,
				asset: {
					approval: {
						topic: 2,
						value: issueAssetTransaction.id
					}
				}
			}));
		})

		var dappTransaction = null;
		if (dapp) {
			dappTransaction = {
				type: 5,
				amount: '0',
				fee: 0,
				timestamp: 0,
				recipientId: null,
				senderId: genesisAccount.address,
				senderPublicKey: genesisAccount.keypair.publicKey,
				asset: {
					dapp: dapp
				}
			};

			transactions.push(signTransaction(genesisAccount.keypair, dappTransaction));
		}

		// transactions = transactions.sort(function compare(a, b) {
		// 	if (a.type != b.type) {
    //     if (a.type == 1) {
    //       return 1;
    //     }
    //     if (b.type == 1) {
    //       return -1;
    //     }
    //     return a.type - b.type;
    //   }
    //   if (a.amount != b.amount) {
    //     return a.amount - b.amount;
    //   }
    //   return a.id.localeCompare(b.id);
		// });

		transactions.forEach(function (tx) {
			bytes = transactionsLib.getTransactionBytes(tx);
			payloadLength += bytes.length;
			payloadHash.update(bytes);
		});

		payloadHash = payloadHash.digest();

		var block = {
			version: 0,
			totalFee: 0,
			reward: 0,
			payloadHash: payloadHash.toString('hex'),
			timestamp: 0,
			numberOfTransactions: transactions.length,
			payloadLength: payloadLength,
			previousBlock: null,
			generatorPublicKey: sender.keypair.publicKey,
			transactions: transactions,
			height: 1
		};

		bytes = getBytes(block);
		block.blockSignature = cryptoLib.sign(sender.keypair, bytes);
		bytes = getBytes(block);
		block.id = cryptoLib.getId(bytes);

		return {
			block: block,
			dapp: dappTransaction,
			delegates: delegates
		};
	},

	from: function (genesisBlock, genesisAccount, dapp) {
		for (var i in genesisBlock.transactions) {
			var tx = genesisBlock.transactions[i];

			if (tx.type == 5) {
				if (tx.asset.dapp.name == dapp.name) {
					throw new Error("DApp with name '" + dapp.name + "' already exists in genesis block");
				}

				if (tx.asset.dapp.git == dapp.git) {
					throw new Error("DApp with git '" + dapp.git + "' already exists in genesis block");
				}

				if (tx.asset.dapp.link == dapp.link) {
					throw new Error("DApp with link '" + dapp.link + "' already exists in genesis block");
				}
			}
		}

		var dappTransaction = {
			type: 5,
			amount: '0',
			fee: 0,
			timestamp: 0,
			recipientId: null,
			senderId: genesisAccount.address,
			senderPublicKey: genesisAccount.keypair.publicKey,
			asset: {
				dapp: dapp
			}
		};

		var bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.signature = cryptoLib.sign(genesisAccount.keypair, bytes);
		bytes = transactionsLib.getTransactionBytes(dappTransaction);
		dappTransaction.id = cryptoLib.getId(bytes);

		genesisBlock.payloadLength += bytes.length;
		var payloadHash = crypto.createHash('sha256').update(new Buffer(genesisBlock.payloadHash, 'hex'));
		payloadHash.update(bytes);
		genesisBlock.payloadHash = payloadHash.digest().toString('hex');

		genesisBlock.transactions.push(dappTransaction);
		genesisBlock.numberOfTransactions += 1;
		genesisBlock.generatorPublicKey = sender.keypair.publicKey;

		bytes = getBytes(genesisBlock);
		genesisBlock.blockSignature = cryptoLib.sign(sender.keypair, bytes);
		bytes = getBytes(genesisBlock);
		genesisBlock.id = cryptoLib.getId(bytes);

		return {
			block: genesisBlock,
			dapp: dappTransaction
		};
	}
}
