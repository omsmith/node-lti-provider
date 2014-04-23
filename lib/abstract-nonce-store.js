'use strict';

var Promise = require('bluebird');

var utils = require('./utils');

function AbstractNonceStore (opts) {
	var self = this;

	opts = opts || {};

	self._timeout = opts.timeout || utils.timeout;
	self._clock = opts.clock || utils.clock;
}

AbstractNonceStore.prototype.unseen = function (nonce) {
	var self = this;

	var isUnseen = typeof self._unseen === 'function'
		? self._unseen(nonce)
		: false;

	isUnseen = Promise.cast(isUnseen);

	return isUnseen
		.then(function (unseen) {
			if (!unseen) {
				return Promise.reject(new Error('Nonce already seen in timeout period'));
			}

			self.turn(nonce);

			return true;
		});
};

AbstractNonceStore.prototype.turn = function (nonce) {
	var self = this;

	if (typeof self._turn === 'function') {
		self._turn(nonce, self._clock() + self._timeout);
	}
};

module.exports = AbstractNonceStore;
