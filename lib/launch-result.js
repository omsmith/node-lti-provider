'use strict';

function LaunchResult (props) {
	var self = this;

	self.body = {};
	Object
		.keys(props)
		.forEach(function (prop) {
			if (!/^oauth_/.test(prop)) {
				self.body[prop] = props[prop];
			}
		});

	if (typeof self.body.roles === 'string') {
		self.body.roles = self.body.roles.split(',');
	}

	self.student = self.hasRole('learner') || self.hasRole('student');
	self.instructor = self.hasRole('instructor') || self.hasRole('faculty') || self.hasRole('staff');
	self.contentDeveloper = self.hasRole('ContentDeveloper');
	self.member = self.hasRole('Member');
	self.manager = self.hasRole('Manager');
	self.mentor = self.hasRole('Mentor');
	self.admin = self.hasRole('administrator');
	self.ta = self.hasRole('TeachingAssistant');
}

LaunchResult.prototype.hasRole = function (role) {
	var self = this;

	role = role.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
	var regex = new RegExp('^(urn:lti:role:ims/lis/)?' + role + '$', 'i');

	return self.body.roles && self.body.roles.some(regex.test.bind(regex));
};

module.exports = LaunchResult;
