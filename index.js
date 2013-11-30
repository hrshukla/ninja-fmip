var util = require('util'),
    stream = require('stream'),
	geolib = require('geolib'),
	configHandlers = require('./lib/config'),
    Sosumi = require('./lib/sosumi');

var log = console.log;

util.inherits(driver,stream);
util.inherits(FMiPDevice, stream);

// Our greeting to the user.
// *** Put this in config.js ****
var ANNOUNCEMENT = {
  "contents": [
    { "type": "heading",      "text": "FMiP Driver Loaded" },
    { "type": "paragraph",    "text": "You need to configure this driver using the \"Drivers\" button in the dashboard." }
  ]
};

function driver(opts,app) {
	var self = this;
	this._app = app;
	this._opts = opts;
	
	// Initialize the variables
	this._opts.fmipusers = opts.fmipusers || {};	// iCloud users
	this._opts.homelat = this._opts.homelat || '';  // Home Latitude (decimal)
	this._opts.homelong = this._opts.homelong || ''; // Home Longitude
	this._opts.radius = this._opts.radius || 500;	// Default geofence radius of 500 metres
	this._opts.scanDelay = this._opts.scanDelay || 60 * 1000 ;	// Scan every 60 secs when asked to determine presence
	this._opts.presence = this._opts.presence || 'unknown';		// Initial presence unknown

	this._users = {};
	
	app.on('client::up',function(){
	
		// The client is now connected to the Ninja Platform

		// Check if we have sent an announcement before.
		// If not, send one and save the fact that we have.
		if (!opts.hasSentAnnouncement) {
			self.emit('announcement',ANNOUNCEMENT);
			opts.hasSentAnnouncement = true;
		}
	
		self.save();
		
		for (var id in opts.fmipusers) {
			this.add(id, opts);
		}	
	}.bind(this));
}

driver.prototype.config = function(rpc,cb) {
	//Config Screens go here
	var self = this;

  if (!rpc) {
    return configHandlers.probe.call(this,cb);
  }

  switch (rpc.method) {
    case 'add_user_show':   return configHandlers.add_user_show.call(this,rpc.params,cb); break;
    case 'add_user':  return configHandlers.add_user.call(this,rpc.params,cb); break;
    case 'add_location_show':  return configHandlers.add_location_show.call(this,rpc.params,cb); break;
    case 'add_location':  return configHandlers.add_location.call(this,rpc.params,cb); break;
	case 'mainMenu': return configHandlers.probe.call(this,cb); break;
    default:               return cb(true);                                              break;
  }
};

driver.prototype.add = function(id) {

  if (this._users[id]) {
    return;
  }
  
  var username = this._opts.fmipusers[id].user;
  var password = this._opts.fmipusers[id].password;
  
  var opts = this._opts;
  var app = this._app;
  var users = this._users;
  var self = this;
  // Lets create the Sosumi object to save devices in options
  log('FMiP - Creating parent Sosumi object');
  this._fmipService = new Sosumi(username, password);
   	
	// Sosumi event - Devices
  this._fmipService.on('devices', function(devices){
		
		//console.log('Opts is '+JSON.stringify(opts));
		for (var deviceIndex = 0; deviceIndex < devices.length; deviceIndex++) {
			// If opts doesn't know of this device, lets add it in
			if( ! opts.fmipusers[id].iDevices.hasOwnProperty(devices[deviceIndex].id)){
				var deviceID = devices[deviceIndex].id ;
				var deviceName = devices[deviceIndex].name ;
				var newDevice = {'id': deviceID, 'name': deviceName, 'useForPresence': true };
				log('FMiP - Adding to options ' + deviceName);
				// Set device information in options
				opts.fmipusers[username].iDevices[devices[deviceIndex].id] = newDevice ;
			}
			
			// Lets register devices - Call FMiPDevice function that takes care of 
  			// registering both the user, as well as his iDevices as NinjaBlocks devices
  		  if(deviceIndex == devices.length - 1){ 	
  		  	app.log.info('FMiP: Adding:' + id );
		  	var parentDevice = new FMiPDevice(id, opts, app); 
		  	users[id] = parentDevice;

		  	Object.keys(parentDevice.myRegister).forEach(function(key){
				log('FMiP - Adding sub-device', key, parentDevice.myRegister[key].G);
				self.emit('register', parentDevice.myRegister[key] );
		  	});
		  }		
		}
	});
	// Save options
	this.save();
		

	// Any Sosumi errors	
	this._fmipService.on('error', function(err) {
		log ('FMiP - Library error: ' + err);
	});	
	
};

module.exports = driver;

function  FMiPDevice(id, opts, app) {

	util.inherits(iUser, stream);
	util.inherits(iDevice, stream);
	//log('FMiP - FMiPDevice running for ' + id);
	
	this.opts = opts;
	this.app = app;
	this.idevices = {};
	this.myRegister = {};
	var self = this;
	
	
	// Add the user as one of the NinjaBlocks devices to create
	//log('FMiP - Calling iUser function for '+id);
	this.myRegister[id] = new iUser(id);
	//this.emit('register', new iUser(id));
	
	// Add each of the user's devices as NB devices
	var myDevices = Object.keys(opts.fmipusers[id].iDevices);
	myDevices.forEach(function(myDevice){
		log('FMiP - Calling iDevice function for: ' + opts.fmipusers[id].iDevices[myDevice].name);
		//this.emit('register', new iDevice(id, myDevice));
		self.myRegister[myDevice] = new iDevice(id, myDevice); 
		//console.log(util.inspect(self.myRegister));
			
	});
	
	
	
	//log('My Register is '+ util.inspect(self.myRegister));	
	
	// Function iUser
	function iUser(id){
		// log('FMiP - Do we have opts? - ' + JSON.stringify(self.opts));
		this.writeable = false;
		this.readable = true;
		this.V = 0;
		this.D = 269;	// Using XBOX presence driver for the moment
		this.G = 'fmip'+ self.opts.fmipusers[id].user.replace(/[^a-zA-Z0-9]/g, '');
		this.name = 'Find My iPhone - ' + self.opts.fmipusers[id].user;
		
		var device = this;
				
		
		// At regular intervals:
		
		setInterval(function() {
			if(! self.idevices.hasOwnProperty(id)){
				var toSend = 'undetermined';
			} else {
				var toSend = self.idevices[id].presence ;
			}
			log('FMiP - Sending data: '+toSend);
			self.createSosumi(id, function(){
				device.emit('data', toSend);
			});
		}, self.opts.scanDelay, id);	
	}

	//util.inherits(iUser, stream);	
	
	function iDevice(username, myDevice) {
		//log('Device ID is ' + myDevice);
		this.writeable = true;
		this.readable = true;
		this.V = 0;
		this.D = 2000;	// Using generic state device
		this.G = username.replace(/[^a-zA-Z0-9]/g, '') + self.opts.fmipusers[username].iDevices[myDevice].name.replace(/[^a-zA-Z0-9]/g, '');
		this.name = username +' - ' + self.opts.fmipusers[username].iDevices[myDevice].name;
		
		var device = this;
		//var idevices = this.idevices;
		
		// Emit data for this device, but only if idevices has been populated
		setInterval(function(){
			//log('idevices is ' + JSON.stringify(self.idevices));
			if(self.idevices.hasOwnProperty(myDevice)){ 
				var toSend = { latitude: self.idevices[myDevice].latitude,
							longitude: self.idevices[myDevice].longitude,
							owner: username, device_id: myDevice };
				device.emit('data', toSend);
			} 	
		}, self.opts.scanDelay);
	}
	
	iDevice.prototype.write = function(data){
		self.actuateSosumi(data,function(logMsg){
			log(logMsg);
		});	
	}	//util.inherits(iDevice, stream);
	
}	
		

FMiPDevice.prototype.actuateSosumi = function(data,callback){
	
		log('FMiP - Received data to actuate: '+JSON.stringify(data));
		
		// Lets extract our key variables
		if(!data.owner || !data.device_id || !data.command){
			log('FMiP - Actuation Data did not have at least one required attribute set');
			return;
		}
		var username = data.owner ;
		var password = this.opts.fmipusers[username].password;
		var deviceId = data.device_id ;
		// Lets create a Sosumi object
		var fmipService = new Sosumi(username, password);
		var self = this;
		
		// Log errors & messages
		fmipService.on('error', function(err){
			callback('FMiP - Library error: ' + err);
		});
		
		fmipService.on('messageSent', function(info){
			callback('FMiP - Message successfully sent to: '+self.opts.fmipusers[username].iDevices[deviceId].name);
		});
		
		fmipService.on('locked', function(info){
			callback('FMiP - Successfully locked: '+self.opts.fmipusers[username].iDevices[deviceId].name);
		});	
		
		fmipService.on('devices', function(info){
		
			switch(data.command){
				case 'alarm':		// We have been issued an alarm command
					var msg = data.args.msg || 'This is a test message';
					var alarm = data.args.alarm || false;
					var subject = data.args.subject || 'Testing FMiP Driver for Ninja Blocks';
					log('FMiP - Sending alarm message to '+self.opts.fmipusers[username].iDevices[deviceId].name);
					fmipService.sendMessage(msg, alarm, deviceId, subject);
					break;
				case 'lock':
					if(! data.args.passcode){
						log('FMiP - No passcode supplied to remote lock device');
						return;
					}	
					var passcode = data.args.passcode; 
					log('FMiP - Attempting to remote lock '+self.opts.fmipusers[username].iDevices[deviceId].name);
					fmipService.remoteLock(passcode, deviceId);
					break;
				default:
					log('FMiP - Unknown command sent from cloud: '+data.command);
					return;
			}
		});	
	}

FMiPDevice.prototype.createSosumi = function(id, callback){
	log('FMiP - Creating Sosumi object at regular interval');
	//log('idevices is ' + JSON.stringify(this.idevices));
	//log('opts is '+JSON.stringify(this.opts));
	//log('Username is '+this.opts.fmipusers[id].user);
	
	
	var iCloudData = new Sosumi(this.opts.fmipusers[id].user, this.opts.fmipusers[id].password);
	var username = this.opts.fmipusers[id].user;
	var idevices = this.idevices;
	var opts = this.opts;
	
	// Initialize presence info
	if (! idevices.hasOwnProperty(username) ){
		idevices[username] = {"presence" : 'present'};
	}	
	
	// Log library errors	
	iCloudData.on('error', function(err) {
		log ('FMiP - Library error: ' + err);
	});
	
	iCloudData.on('devices', function(devices){
		for (var deviceIndex = 0; deviceIndex < devices.length; deviceIndex++) {
			log('FMiP - Trying to locate '+devices[deviceIndex].name);
			iCloudData.locate(devices[deviceIndex],120);
		}
	});
		
	// Location event should now be emitted
	iCloudData.on('located', function(content){
		log('FMiP - Received a located event for: '+content.name); 
		// Set the variable that holds device location
		if(! idevices.hasOwnProperty(content.id)){
			log('FMiP - Creating device id in deviceids for' +content.name);
			idevices[content.id] = {};
		}
		log('Adding geolocations in idevices for '+content.name);	
		idevices[content.id].latitude = content.latitude;
		idevices[content.id].longitude = content.longitude;
		
		// If this device is nominated to be one of the devices that determines presence
		if(opts.fmipusers[username].iDevices[content.id].useForPresence){
			log('Establishing presence info for '+content.name);
			var inGeoFence = geolib.isPointInCircle(
				{latitude: content.latitude, longitude: content.longitude},
				{latitude: opts.homelat, longitude: opts.homelong}, 
				opts.radius
			);
			idevices[content.id].inGeoFence = inGeoFence;
			
			if( inGeoFence == false){
			// If inGeoFence is false, we have at least 1 device that is away, so the user is away
				idevices.username.presence = 'absent';
			}	
		}
	});		
	
	callback();
	
}	


			
	

