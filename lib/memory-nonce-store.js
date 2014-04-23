'use strict';

var util = require('util');

var AbstractNonceStore = require('./abstract-nonce-store'),
	utils = require('./utils');

function MemoryNonceStore (opts) {
	var self = this;

	if (!(self instanceof MemoryNonceStore)) {
		return new MemoryNonceStore(opts);
	}

	AbstractNonceStore.call(self, opts);

	self._store = {};
	self._clock = opts._clock || utils.clock;
}

util.inherits(MemoryNonceStore, AbstractNonceStore);

MemoryNonceStore.prototype._unseen = function (nonce) {
	var self = this;

	setImmediate(self._expire.bind(self));

	if (self._store[nonce] === undefined) {
		return true;
	}

	return false;
};

MemoryNonceStore.prototype._turn = function (nonce, expiry) {
	var self = this;

	self._store[nonce] = expiry;
};

MemoryNonceStore.prototype._expire = function () {
	var self = this;

	var now = self._clock();

	Object
		.keys(self._store)
		.forEach(function (nonce) {
			if (self._store[nonce] <= now) {
				delete self._store[nonce];
			}
		});
};

module.exports = MemoryNonceStore;
