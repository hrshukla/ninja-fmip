var messages = require('./config_messages');

exports.probe = function(cb) {
	cb(null,messages.probeGreeting);
};

exports.add_user_show = function(params, cb) {
	cb(null, messages.add_user_show);
};

exports.add_location_show = function(params, cb) {
	cb(null, messages.add_location_show);
};	

exports.add_user = function(params, cb){
	// If user exists, don't add
	if(this._opts.fmipusers[params.username]){
		return;
	} else {
		// Lets add the user in our options
		this._opts.fmipusers[params.username] = {user: params.username, password: params.password, iDevices: {}};
		this.save();
		cb(null, messages.Success);
		this.add(params.username);
	}		
};

exports.add_location = function(params, cb){
	this._opts.homelat = params.homelat;
	this._opts.homelong = params.homelong;
	this._opts.radius = params.radius;
	this.save();
	cb(null, messages.Success);	
};
