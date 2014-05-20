var config = require('../config/config'),
    Promise = require('bluebird'),
    qs = require('querystring'),
    request = require('request');

/*
 Get a list of the artists in a user's rdio collection
 */
exports.getArtists = function( access_token ) {
  return new Promise(function( resolve, reject ) {
    var body = qs.stringify({ method : 'getArtistsInCollection' });
    console.log('making request to rdio');
    request.post({
      url : config.RDIO_API_URL,
      headers : { "Content-type" : 'application/x-www-form-urlencoded',
        "Authorization" : 'Bearer ' + access_token },
      body : body,
      json : true
    }, function( err, r, body ) {
      if ( err ) {
        console.log('error occurred when retrieving artist list from rdio');
        reject();
      }
      var rdio_ids = formatArtistData(body.result);
      return resolve(rdio_ids);
    });
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
