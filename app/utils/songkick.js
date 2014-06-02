var config = require('../config/config'),
    request = require('request'),
    _ = require('lodash');

exports.getMetroIds = function( user_coordinates, callback ) {
  var url = config.SONGKICK_API_URL + 'search/locations.json?location=geo:'
    + user_coordinates.lat + ',' + user_coordinates.long + '&apikey=' + config.SONGKICK_API_KEY;

  request.get({
    url : url
  }, function( err, r, body ) {
    if ( err ) {
      return callback(err);
    }
    try {
      var results = JSON.parse(body);
    } catch ( e ) {
      return callback(e);
    }

    if ( results.resultsPage.status == 'ok' ) {
      var valid_ids = getValidIds(results.resultsPage.results.location, user_coordinates);
      return callback(null, valid_ids);
    }

  });
};


// Create an array of ids with the following conditions:
// Each id must be unique
// Each lat/long coordinate must be close to the user's location
// (Checking this bc some of the IDs returned from the API are not near the
// user at all.)
function getValidIds( locations, user_coordinates ) {

  return _.chain(locations)
    .map(function( location ) {
      if ( hasValidCoordinates(user_coordinates, location.metroArea) ) {
        return location.metroArea.id;
      }
    })
    .uniq()
    .compact()
    .value();
}

// Determine if the 2 sets of coordinates are near each other
function hasValidCoordinates( user_coordinates, metro_coordinates ) {
  var userLatitude = Number(user_coordinates.lat),
      userLongitude = Number(user_coordinates.long),
      remoteLatitude = Number(metro_coordinates.lat),
      remoteLongitude = Number(metro_coordinates.lng);

  return !!(( Math.abs(remoteLatitude - userLatitude) < 1 )
    && ( Math.abs(remoteLongitude - userLongitude) < 1 ));
}