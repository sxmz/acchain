var crypto = require("./crypto.js"),
    constants = require("../constants.js"),
    slots = require("../time/slots.js");

function createVote(keyList, secret, secondSecret) {
	var keys = crypto.getKeys(secret);

	var transaction = {
		type: 3,
		amount: '0',
		fee: constants.fees.vote * keyList.length,
		recipientId: null,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTime() - constants.clientDriftSeconds,
		asset: {
			vote: {
				votes: keyList
			}
		}
	};

	crypto.sign(transaction, keys);

	if (secondSecret) {
		var secondKeys = crypto.getKeys(secondSecret);
		crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = crypto.getId(transaction);

	return transaction;
}

module.exports = {
	createVote: createVote
}
