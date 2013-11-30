//
//  sosumi.js
//  node-sosumi
//
//  Created by Nicholas Penree on 8/21/10.
//  Copyright 2010 Conceited Software. All rights reserved.
//
// Note: Software originally created as per copyright above.
// Further modified heavily to make it work successfully and
// also adapt for the Ninja Blocks driver, by Himanshu Shukla (hrshukla@gmail.com)
//
// Note to self: Submit code fixes upstream 

var util = require('util'),
	lj = require('longjohn'),
    events = require('events'),
    https = require('https'),
    Buffer = require('buffer').Buffer,
    Sosumi = exports = module.exports = 

function Sosumi(mobileMeUsername, mobileMeUserPassword, debug, performUpdateNow)
{
    var self = this;
    events.EventEmitter.call(this);
    this.devices = [];
    this.username = mobileMeUsername;
    this.password = mobileMeUserPassword;
    this.redir_host = '';
		
	if(debug === true){
		this.debug = true;
	}

	// We will make a post first up to figure out our redirected host
	var body = JSON.stringify({
		"clientContext" : {
			"appName":"FindMyiPhone",
			"appVersion":"1.4",
			"buildVersion":"145",
			"deviceUDID":"0000000000000000000000000000000000000000",
			"inactiveTime":2147483647,
			"osVersion":"4.2.1",
			"personID":0,
			"productType":"iPad1,1"
		}
	});
	self.postAPICall('/fmipservice/device/' + this.username + '/initClient', body,function(response){
		self.iflog('Received redir: ' + response);
		self.redir_host = response;
		if (typeof performUpdateNow === 'undefined' || performUpdateNow === true) {
			self.updateDevices();
		}
	});
}



util.inherits(Sosumi, events.EventEmitter);

Sosumi.prototype.locate = function(seekedDevice, timeout)
{
	var self = this;
	self.iflog('FUNCTION: locate');
		
	if (seekedDevice['location'] && seekedDevice.location.locationFinished) {
		self.emit('located', {
				id: seekedDevice.id,
				name: seekedDevice.name,
               latitude: seekedDevice.location.latitude, 
               longitude: seekedDevice.location.longitude,
               accuracy: seekedDevice.location.horizontalAccuracy,
               timestamp: seekedDevice.location.timeStamp,
               type: seekedDevice.location.positionType 
           });
		}
	else {
		//setTimeout(self.locate(seekedDevice, timeout));
		//self.iflog('Wasnt able to locate ' + seekedDevice.name);
		//self.emit('located', 'Wasnt able to locate: ' + seekedDevice.name);
	}	
}


Sosumi.prototype.sendMessage = function(msg, alarm, deviceId, subject)
{
    //if (deviceIndex >= this.devices.length) return;
    
    var self = this,
    body = JSON.stringify({
        "clientContext":{
			"appName":"FindMyiPhone",
			"appVersion":"1.4",
			"buildVersion":"145",
			"deviceUDID":"0000000000000000000000000000000000000000",
			"inactiveTime":5911,
			"osVersion":"3.2",
			"productType":"iPad1,1",
			"selectedDevice":deviceId,
			"shouldLocate":false
		},
        "device" : deviceId,
		"serverContext":{
			"callbackIntervalInMS":3000,
			"clientId":"0000000000000000000000000000000000000000",
			"deviceLoadStatus":"203",
			"hasDevices":true,
			"lastSessionExtensionTime":null,
			"maxDeviceLoadTime":60000,
			"maxLocatingTime":90000,
			"preferredLanguage":"en",
			"prefsUpdateTime":1276872996660,
			"sessionLifespan":900000,
			"timezone":{
				"currentOffset":-25200000,
				"previousOffset":-28800000,
				"previousTransition":1268560799999,
				"tzCurrentName":"Pacific Daylight Time",
				"tzName":"America/Los_Angeles"
				},
			"validRegion":true
		},
		"sound" : (alarm) ? 'true' : 'false',
        "subject" : subject,
        "text" : msg,
		"userText": true
    });

    this.postAPICall('/fmipservice/device/' + this.username + '/sendMessage', body, function (content) {
    	self.iflog('data is '+JSON.stringify(content));
        self.emit('messageSent', { subject: subject, message: msg, alarm: alarm, deviceId: deviceId });
    });
}

Sosumi.prototype.remoteLock = function(passcode, deviceId)
{
   // if (deviceIndex >= this.devices.length) return;
    
    var self = this,
    body = JSON.stringify({
        "clientContext" : {
            "appName":"FindMyiPhone",
			"appVersion":"1.4",
			"buildVersion":"145",
			"deviceUDID":"0000000000000000000000000000000000000000",
			"inactiveTime":5911,
			"osVersion":"3.2",
			"productType":"iPad1,1",
			"selectedDevice":deviceId,
			"shouldLocate":false
        },
        "device" : deviceId,
        "serverContext" : {
            "callbackIntervalInMS":3000,
			"clientId":"0000000000000000000000000000000000000000",
			"deviceLoadStatus":"203",
			"hasDevices":true,
			"lastSessionExtensionTime":null,
			"maxDeviceLoadTime":60000,
			"maxLocatingTime":90000,
			"preferredLanguage":"en",
			"prefsUpdateTime":1276872996660,
			"sessionLifespan":900000,
			"timezone":{
				"currentOffset":-25200000,
				"previousOffset":-28800000,
				"previousTransition":1268560799999,
				"tzCurrentName":"Pacific Daylight Time",
				"tzName":"America/Los_Angeles"
				},
			"validRegion":true
        },
        "oldPasscode" : "",
        "passcode" : passcode
    });

    this.postAPICall('/fmipservice/device/' + this.username + '/remoteLock', body, function (content) {
        self.emit('locked', { passcode: passcode, deviceIndex: deviceIndex });
    });
}

Sosumi.prototype.postAPICall = function(url, body, callback)
{
	
    var self = this;
	self.iflog('FUNCTION: postAPICall');
	
    var headers = {
        //'Authorization' : 'Basic ' + new Buffer(this.username + ':' + this.password, 'utf8').toString('base64'),
        'X-Apple-Realm-Support' : '1.0',
        'Content-Type' : 'application/json; charset=utf-8',
        'Content-Length' : body.length,
        'X-Client-Name' : 'iPad',
		'X-Apple-Find-Api-Ver' : '2.0',
        'X-Apple-Authscheme': 'UserIdGuest',
        'User-agent' : 'Find iPhone/1.4 MeKit (iPad: iPhone OS/4.2.1)',
        'Accept-Language': 'en-us',
        //'Connection': 'keep-alive',
        'X-Client-Uuid' : '0cf3dc491ff812adb0b202baed4f94873b210853'
    };
	
	if(this.redir_host){
		var newHost = this.redir_host ;
	} else {
		var newHost = 'fmipmobile.icloud.com';
	}
			
	var options = {
		hostname: newHost,
		port: 443,
		method: 'POST',
		auth: this.username + ':' + this.password,
		path: url,
		headers: headers
	};	
    
	var req = https.request(options, function(res) {
		self.iflog('URL: '+ newHost + url);
		self.iflog('STATUS: ' + res.statusCode);
		self.iflog('HEADERS: ' + JSON.stringify(res.headers));
		
		res.setEncoding('utf8');
		var result = '';
			
		if(res.statusCode == 200 || res.statusCode == 500 ){
			res.on('data', function (chunk) {
				//self.iflog('BODY: ' + chunk);
				result = result + chunk;
			});
			
			res.on('end', function () {
					var jsonData = JSON.parse(result);
										
					if (typeof jsonData !== 'undefined' && jsonData.statusCode == '200') {
						callback(jsonData.content);
					} else {
						callback(null);
					}
			});
		} else if(res.statusCode == 330) { 	// We get a redirect
			
			if(res.headers['x-apple-mme-host']){
				self.iflog ('URL to redirect: ' + res.headers['x-apple-mme-host'] );
				//self.emit('redirect',res.headers['x-apple-mme-host']);
				//this.redir_response = res.headers['x-apple-mme-host'];
				callback(res.headers['x-apple-mme-host']);
				//return res.headers['x-apple-mme-host'];
			} else {
				self.iflog ('REDIRECT: Could not find redirect header');
			}		
		} else if (res.statusCode == 401 || res.statusCode == 403) {
            self.emit('error', new Error('Invalid credentials passed for MobileMe account: ' + self.username));
        } else {
            self.emit('error', new Error('HTTP Status returned non-successful: ' + res.statusCode));
        }	
	});
	//Apple server looks like its sending a delayed FIN; Explicitly ask to close connection
	req.shouldKeepAlive = false; 
	
	req.on('error', function(e) {
	  self.iflog('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(body, 'utf8');
	//req.end(body, 'utf8');
	req.end();
}

Sosumi.prototype.iflog = function( message )
{
	var self = this;
	if ( this.debug ){
		console.log(message + '\n');
	}
}

Sosumi.prototype.updateDevices = function()
{
    
	var self = this,
    body = JSON.stringify({
        "clientContext" : {
            "appName":"FindMyiPhone",
			"appVersion":"1.4",
			"buildVersion":"145",
			"deviceUDID":"0000000000000000000000000000000000000000",
			"inactiveTime":2147483647,
			"osVersion":"4.2.1",
			"personID":0,
			"productType":"iPad1,1"
        }
    });
	self.iflog('FUNCTION: updateDevices');
	
	this.postAPICall('/fmipservice/device/' + this.username + '/initClient', body, function (devices) {
		self.devices = devices;
		self.emit('devices', self.devices);
	});
	
}