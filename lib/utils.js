'use strict';

module.exports = {
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
	}
};
