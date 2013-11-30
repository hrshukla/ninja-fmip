# ninja-fmip
A [Ninja Blocks](http://www.ninjablocks.com) driver to communicate with Apple's **Find My iPhone** service

## Features

* Creates a "sensor" device for each Find My iPhone / iCloud user that you add
* Creates a "sensor" and "actuator" device for each of the user's iDevices that Find My Iphone service knows of
* The 'user' device emits presence information (present / absent) based on whether or not all of the user's devices are within a geofence (configured via settings)
* Each iDevice emits latitude and longitude info, along with its own presence information
* Each iDevice can be actuated - either send an alarm / message to the device, or remotely lock the device using a passcode. 
* NOTE: Plotting iDevice location on map and actuating with commands as above requires the Beta Dashboard to be enabled and a supporting gist - see below. 

## Installation

Should be as simple as downloading the ninja-fmip in your NB drivers folder and running a npm install 

You'll also need to use / create a gist for the Beta Dashboard to access most features above. I have created a (ugly) one here: https://gist.github.com/hrshukla/7698939 which should be treated as alpha / proof of concept.

## Thanks
The FMiP library that this code uses is originally written by Nicholas Penree ([https://github.com/drudge/node-sosumi](https://github.com/drudge/node-sosumi))

I have modified his code heavily to make it work with the latest Find My iPhone service and also to adapt it to suit Ninja Blocks.

The code also relies on the geolib library ([https://github.com/manuelbieh/Geolib](https://github.com/manuelbieh/Geolib))

Lastly, as a non-programmer, and also as a total newbie to Node, a lot of inspiration has come from the code written by various authors of Ninja Blocks drivers, especially those by Elliot Shepherd ([https://github.com/elliots](https://github.com/elliots))


