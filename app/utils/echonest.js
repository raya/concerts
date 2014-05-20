var config = require( '../config/config'),
    Promise = require('bluebird'),
    request = require('request');

// From http://developer.echonest.com/docs/v4#response-codes
var RESPONSE_CODES = {
  'VALID' : 0
};

/*
  Creates a catalog with Echonest. A successful response returns a catalog id.
 */
exports.createCatalogProfile = function() {
  return new Promise( function( resolve, reject ) {
    var form = {
      api_key : config.ECHONEST_API_KEY + 'BAD',
      name : generateRandomName(),
      format : 'json',
      type : 'artist'
    };

    var url = config.ECHONEST_API_URL + 'tasteprofile/create';
    request.post({
      url : url,
      headers : {'content-type' : 'application/x-www-form-urlencoded'},
      form : form
    }, function( err, r, body ) {
      if ( err ) {
        reject( err );
      }
      try {
        var result = JSON.parse( body );
      } catch ( e ) {
        return reject( 'Error parsing result from Echonest:', body );
      }
      if ( result.response.status.code === RESPONSE_CODES.VALID ) {
        return resolve( result.response.id );
      } else {
        return reject( 'invalid echonest code' );
      }
    });

  });
};

/* Generate a random name to give to a Catalog profile */
function generateRandomName() {
  return 'tasteprofile_' + Math.random().toString(36).slice(2);
}
