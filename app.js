'use strict' ;

const drachtio = require('drachtio') ;
const app = drachtio();
const Mrf = require('drachtio-fsmrf');
const mrf = new Mrf(app) ;
const Srf = require('drachtio-srf') ;
const srf = new Srf(app) ;
const MediaServices = require('./lib/media-services') ;
var debug = require('debug');
const registrationHandler = require('./lib/registrationHandler');
const async = require('async');

const config = require('./config');
const Call = require('./lib/call');
const call = new Call(config, srf);
const incall = require('./lib/incall');

srf.connect(config.drachtioConnectOpts) ;

mrf.connect(config.mediaserverConnectOpts, (ms) => {
  console.log(`finally connected to mediaserver ${JSON.stringify(ms)}`);
  MediaServices.MediaResources.addMediaServer( ms ) ;
});

srf.on('connect', (err, hostport) => {
  console.log('connected to drachtio listening for SIP on %s', hostport) ;
}) ;

mrf.on('connect', (ms) => {
  if (err) { debug(err); }
  console.log('connected to media server listening on %s:%s', ms.sipAddress, ms.sipPort) ;
  MediaServices.addMediaServer( ms ) ;
});

// registerUser function's callback receives expires variable
// from the 200 OK back from the registrar

registrationHandler.register(config.user, srf, '3600')
  .then((result) => {
    registrationHandler.register(result.opts, result.srf, result.expires);
  });

// ideal final setup
// scenario.run(scenarioOpts)
// OR
// for multiple scenarios
/*
scenarioOpts.map((test) => {
  scenario.run(test);
});
*/

// call.receive with promises
call.receive(config.user, srf)
  .then((result) => {
    call.connect(result.req, result.res, result.opts)
    .then((result) => {
      incall.playRecording(result.ep, result.dialog, ['ivr/8000/ivr-oh_whatever.wav']);
    });
  });

/*
// call.send with promises
setTimeout(() => {
  call.getEndpoint(config.user)
    .then((result) => {
      call.send(srf, result.ep, '1000', config.user)
        .then((result) => {
          incall.playRecording(result.ep, result.dialog, ['ivr/8000/ivr-oh_whatever.wav']);
        });
    });
}, 2000); // setTimeout
*/
