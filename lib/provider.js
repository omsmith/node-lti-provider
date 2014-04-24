'use strict';

var crypto = require('crypto'),
	defaults = require('defaults'),
	Promise = require('bluebird'),
	url = require('url');

var LaunchResult = require('./launch-result'),
	utils = require('./utils');

function LtiProvider (opts) {
	var self = this;

	opts = defaults(opts, {
		clock: utils.clock,
		timeout: utils.timeout,
		nonceStore: require('./memory-nonce-store')
	});
	opts.nonceStoreOpts = defaults(opts.nonceStoreOpts, {
		timeout: opts.timeout
	});

	self._clock = opts.clock;
	self._timeout = opts.timeout;
	self._nonceStore = new (opts.nonceStore)(opts.nonceStoreOpts);
	self._secret = opts.secret;

	self.signers = {
		'HMAC-SHA1': function (key, data) {
			return crypto
				.createHmac('sha1', key)
				.update(data)
				.digest();
		}
	};
}

LtiProvider.prototype.authenticate = Promise.method(function (req) {
	var self = this;

	var params = req.body;

	var parsedUrl = url.parse(req.url, true);
	utils.mergeParams(params, parsedUrl.query);

	if (req.headers && req.headers.authorization) {
		var parts = req.headers.authorization.split(' ');
		if (parts.length >= 2) {
			var isOauth = /OAuth/i.test(parts[0]);
			if (isOauth) {
				var headerParams = /(\w+)="([^"]*)"/g.match(req.headers.authorization) || [],
					oauthParams = {};
				headerParams.forEach(function (param) {
					var parts = /(\w+)="([^"]*)"/.exec(param),
						name = utils.decode(parts[0]);

					if (/^oauth_/.test(name)) {
						var value = utils.decode(parts[1]);
						oauthParams[name] = value;
					}
				});

				utils.mergeParams(params, oauthParams);
			}
		}
	}

	[
		'oauth_consumer_key',
		'oauth_nonce',
		'oauth_signature',
		'oauth_signature_method',
		'oauth_timestamp'
	].forEach(function (oauthParam) {
		var value = params[oauthParam];
		if (!value) {
			throw new Error('Request missing ' + oauthParam);
		}
	});

	var timestamp = parseInt(params.oauth_timestamp, 10);
	if (self._clock() - self._timeout > timestamp) {
		return Promise.reject(new Error('oauth_timestamp expired'));
	}

	var signer = self.signers[params.oauth_signature_method];
	if (!signer) {
		return Promise.reject(new Error('Unsupported signature method "' + params.oauth_signature_method + '"'));
	}

	return Promise
		.join(self._secret(params.oauth_consumer_key), self._nonceStore.unseen(params.oauth_nonce))
		.spread(function (secret) {
			var signature = new Buffer(params.oauth_signature, 'base64');
			delete params.oauth_signature;

			var calculatedSignature = signer(secret + '&', utils.buildSignatureData(req, params));

			if (!utils.constantTimeCompare(signature, calculatedSignature)) {
				return Promise.reject(new Error('Signature mismatch'));
			}

			var resultObject = {};
			Object
				.keys(params)
				.forEach(function (name) {
					if (!/^oauth_/.test(name)) {
						resultObject[name] = params[name];
					}
				});

			return new LaunchResult(resultObject);
		});
});

module.exports = LtiProvider;
