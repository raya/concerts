var config = require('../config/config'),
    fs = require('fs'),
    logger = require('./logger'),
    Promise = require('bluebird'),
    qs = require('querystring'),
    request = require('request');

Promise.promisifyAll(fs);

/*
 Get a list of the artists in a user's rdio collection. If user is a demo user,
 return fake data.
 */
exports.getArtists = function( is_demo_user, access_token, callback ) {
  // Demo users get fake data
  if ( is_demo_user ) {
    fs.readFileAsync( './app/config/test_data.json' )
      .then( JSON.parse )
      .then( function( result ) {
        logger.log('info', 'Demo user data being returned');
        return callback( null, result.artists );
      })
      .catch( function( err ) {
        logger.log('error', 'Error reading artist test data file.');
        return callback( err );
      });
  }

  // Logged in Rdio users get their artist collection
  var body = qs.stringify({ method : 'getArtistsInCollection' });
  request.post({
    url : config.RDIO_API_URL,
    headers : { "Content-type" : 'application/x-www-form-urlencoded',
      "Authorization" : 'Bearer ' + access_token },
    body : body,
    json : true
  }, function( err, r, body ) {
    if ( err || body.error ) {
      logger.log('Error retrieving Rdio artist list: %j', err );
      logger.log('Body: %j', body );
      return callback('error');
    }
    var rdio_ids = formatArtistData(body.result);
    return callback(null, rdio_ids);
  });
};

/*
 Strip out the artistKey value from an array of artist data
 */
function formatArtistData( artists ) {
  var rdio_ids = [];
  artists.forEach(function( artist ) {
    rdio_ids.push(artist.artistKey);
  });
  return rdio_ids;
}