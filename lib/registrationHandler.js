'use strict' ;

const async = require('async') ;

const register = (opts, srf, expires) => {
  return new Promise ((resolve, reject) => {
    srf.request(`sip:${opts.username}@${opts.domain}`, {
        method: 'REGISTER',
        headers: {
            'Expires': expires,
            'From': `sip:${opts.username}@${opts.domain}`,
            'Contact': `sip:${opts.username}@${opts.domain}:5060`,
        },
        auth: {
          username: opts.username,
          password: opts.password
        }
    }, function(err, req){
        if( err ) {
          return err ;
        }
        req.on('response', function(res) {
            if( 200 !== res.status) {
              console.log(`Error registering ${res.status}`);
            } else if (200 == res.status) {
              console.log(res.headers);
              var expiresPosition = res.headers.contact.search("expires=");
              var headerLength = res.headers.contact.length;
              var expires = res.headers.contact.substring(expiresPosition+8, headerLength);

              var result = {
                opts: opts,
                srf: srf,
                expires: expires
              };
              var reregister = setInterval(() => { resolve( result ); }, expires*1000, opts, srf, expires);
              setTimeout(() => { unregister(opts, srf, reregister) }, 135000, opts, srf);
            }
        }); // req.on
    }); // srf.request
  }); // new Promise
} // register

const unregister = ( opts, srf, reregister ) => {
  console.log(`unregistering`);
  srf.request(`sip:${opts.username}@${opts.domain}`, {
      method: 'REGISTER',
      headers: {
          'Expires': '0',
          'From': `sip:${opts.username}@${opts.domain}`,
          'Contact': `sip:${opts.username}@${opts.domain}:${opts.hostport}`
      },
      auth: {
        username: opts.username,
        password: opts.password
      }
  }, function(err, req){
      if( err ) {
        return err ;
      }
      req.on('response', function(res) {
          if( 200 !== res.status) {
            console.log(`Error registering ${res.status}`);
          } else if (200 == res.status) {
            clearInterval(reregister);
          }
      }) ;
  }) ;
} // unregister


module.exports.register = register;
module.exports.unregister = unregister;
