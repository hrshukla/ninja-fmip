exports.probeGreeting = {
  "contents":[
    { "type": "paragraph", "text": "Welcome to the Find My iPhone Driver. Begin by adding your iCloud users. Additionally, entering your home's geolocation will allow you to determine presence info"},
    { "type": "paragraph", "text": "Add an iCloud user (Each user becomes a device)"},
    { "type": "submit", "name": "Add", "rpc_method": "add_user_show" },
	{ "type": "paragraph", "text": "Configure your home's geolocation"},
    { "type": "submit", "name": "Add", "rpc_method": "add_location_show" },
  ]
};

exports.add_user_show = {
  "contents":[
    { "type": "paragraph", "text":"Please enter the iCloud username and password"},
    { "type": "input_field_text", "field_name": "username", "value": "", "label": "Username", "placeholder": "someone@gmail.com", "required": true},
	{ "type": "input_field_text", "field_name": "password", "value": "", "label": "Password", "placeholder": "Password", "required": true},
    { "type": "submit", "name": "Add", "rpc_method": "add_user" }
  ]
};

exports.add_location_show = {
  "contents":[
    { "type":"paragraph", "text":"Please configure longitude & latitude. This will determine your geofence. If your device is outside of this geofence radius, your presence will be"},
    { "type": "input_field_text", "field_name": "homelat", "value": "", "label": "Latitude", "placeholder": "", "required": true},
	{ "type": "input_field_text", "field_name": "homelong", "value": "", "label": "Longitude", "placeholder": "", "required": true},
	{ "type": "input_field_text", "field_name": "radius", "value": "", "label": "Radius (metres)", "placeholder": "500", "required": true},
	{ "type":"submit", "name": "Save", "rpc_method": "add_location"}
  ]
};

exports.Success = {
  "contents":[
    { "type":"paragraph", "text":"Action Successful"},
	{ "type":"submit", "name": "Back to Config Screen", "rpc_method": "mainMenu"},    
	{ "type":"close", "text":"All Done"}
  ]
};

exports.Failure = {
  "contents":[
    { "type":"paragraph", "text":"Some error occured"},
	{ "type":"submit", "name": "Back to Config Screen", "rpc_method": "mainMenu"}    
  ]
};
