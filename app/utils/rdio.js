var config = require('../config/config'),
    Promise = require('bluebird'),
    qs = require('querystring'),
    request = require('request');

/*
 Get a list of the artists in a user's rdio collection
 */
exports.getArtists = function( access_token, callback ) {
  var body = qs.stringify({ method : 'getArtistsInCollection' });
  request.post({
    url : config.RDIO_API_URL,
    headers : { "Content-type" : 'application/x-www-form-urlencoded',
      "Authorization" : 'Bearer ' + access_token },
    body : body,
    json : true
  }, function( err, r, body ) {
    if ( err || body.error ) {
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