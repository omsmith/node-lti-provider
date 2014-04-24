'use strict';

var url = require('url');

var utils = module.exports = {
	timeout: 5 * 60,
	clock: function () {
		return Math.round(Date.now() / 1000);
	},
	encode: function (str) {
		return encodeURIComponent(str)
			.replace(/!/g,'%21')
			.replace(/'/g,'%27')
			.replace(/\(/g,'%28')
			.replace(/\)/g,'%29')
			.replace(/\*/g,'%2A');
	},
	decode: function (str) {
		return decodeURIComponent(str);
	},
	mergeParams: function (target, src) {
		target = target || {};

		Object
			.keys(src || {})
			.forEach(function (name) {
				if (/^oauth_/.test(name) || !target[name]) {
					target[name] = src[name];
					return;
				}

				if (!Array.isArray(target[name])) {
					target[name] = [target[name]];
				}

				if (Array.isArray(src[name])) {
					Array.prototype.push.apply(target[name], src[name]);
				} else {
					target[name].push(src[name]);
				}
			});

		return target;
	},
	constantTimeCompare: function (a, b) {
		var length = Math.min(a.length, b.length),
			diff = 0;
		for (var i = 0; i < length; ++i) {
			diff |= a[i] ^ b[i];
		}
		return diff === 0;
	},
	buildSignatureData: function (req, params) {
		var protocol = req.protocol || req.connection.encrypted && 'https' || 'http',
			host = req.headers.host,
			hostParts = host.split(':');
		if (protocol === 'http' && hostParts[1] === 80 || protocol === 'https' && hostParts[1] === 443) {
			host = hostParts[0];
		}

		var method = req.method.toUpperCase(),
			hitUrl = protocol + '://' + host + url.parse(req.url).pathname,
			normalizedParams = Object
				.keys(params)
				.sort()
				.map(function (name) {
					var values = params[name];
					if (!Array.isArray(values)) {
						values = [values];
					}

					return values
						.sort()
						.map(function (value) {
							return name + '=' + utils.encode(value);
						})
						.join('&');
				})
				.join('&');

		return [method, utils.encode(hitUrl), utils.encode(normalizedParams)].join('&');
	}
};
