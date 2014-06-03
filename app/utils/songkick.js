var config = require('../config/config'),
    moment = require('moment'),
    request = require('request'),
    Promise = require('bluebird'),
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

// Get all concerts for a given metro id from start date to end date
// Note: This function is returning a promise instead of a callback for now since
// Bluebird's promisify function overrides the multiple optional arguments with
// a callback
exports.getConcerts = function( metro_id, start_date, end_date ) {
  return new Promise(function( resolve, reject ) {
    start_date = start_date || formatCurrentDate();
    end_date = end_date || formatEndDate(7);

    var url = config.SONGKICK_API_URL + 'metro_areas/' + metro_id + '/calendar.json?'
      + '&apikey=' + config.SONGKICK_API_KEY
      + '&min_date=' + start_date + '&max_date=' + end_date;

    request.get({
      url : url
    }, function( err, r, body ) {
      if ( err ) {
        return reject(err);
      }
      try {
        var results = JSON.parse(body);
      } catch ( e ) {
        return reject(e);
      }
      if ( results.resultsPage.status !== 'ok' ) {
        return reject(results.resultsPage);
      }

      var total_entries = results.resultsPage.totalEntries,
          entries_per_page = results.resultsPage.perPage;

      // Get additional results if needed
      if ( total_entries > entries_per_page ) {
        var total_num_pages = Math.ceil(total_entries / entries_per_page);
        var pages = _.range(2, total_num_pages + 1);
        Promise.map(pages, function( page_number ) {
          return getMoreConcerts(url, page_number);
        }).then(function( more_concerts ) {
          return resolve(_.chain( more_concerts )
            .concat( results.resultsPage.results.event )
            .flatten()
            .value());
        });
      } else {
        if ( total_entries >= 1 ) {
          return resolve(results.resultsPage.results.event);
        }
        else {
          return resolve([]);
        }
      }
    });
  });
};

function getMoreConcerts( base_url, page_number ) {
  return new Promise(function( resolve, reject ) {
    var url = base_url + '&page=' + page_number;

    request.get({
      url : url
    }, function( err, r, body ) {
      if ( err ) {
        return reject(err);
      }

      try {
        var results = JSON.parse(body);
      } catch ( e ) {
        return reject(e);
      }

      if ( results.resultsPage.status == 'ok' ) {
        return resolve(results.resultsPage.results.event);
      } else {
        return reject(results);
      }

    });
  });


}

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

// Return formatted string of today's date as YYYY-MM-DD
function formatCurrentDate() {
  return moment().format('YYYY-MM-DD');
}

// Return formatted string of the date X days from now as YYYY-MM-DD
function formatEndDate( numDaysFromNow ) {
  var nextDays = moment().add('days', numDaysFromNow);
  return nextDays.format('YYYY-MM-DD');
}
