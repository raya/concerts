var config = require('../config/config'),
    Promise = require('bluebird'),
    request = require('request');

// From http://developer.echonest.com/docs/v4#response-codes
var RESPONSE_CODES = {
  'VALID' : 0
};

/*
 Creates a catalog with Echonest. A successful response returns a catalog id.
 */
exports.createCatalogProfile = function( callback ) {
  var form = {
    api_key : config.ECHONEST_API_KEY,
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
      return callback(err);
    }
    try {
      var result = JSON.parse(body);
    } catch ( e ) {
      return callback(body);
    }
    if ( result.response.status.code === RESPONSE_CODES.VALID ) {
      return callback(null, result.response.id);
    } else {
      return callback('invalid echonest code');
    }
  });
};

/*
 Formats rdio artist ids to send to Echonest
 Output format:
 [ { item : {
 artist_id : rdio-US:artist:ID_NUM
 item_id : ANY_UNIQUE_ID
 }]
 */
exports.createCatalogDataFile = function( artists ) {
  var catalog = [];

  if ( !Array.isArray(artists) || artists.length < 1 ) {
    return [];
  }
  artists.forEach(function( artist, index ) {
    var entry = { item : {} };
    entry.item.item_id = String(index);
    entry.item.artist_id = 'rdio-US:artist:' + String(artist);
    catalog.push(entry);
  });
  return catalog;
};

/*
 Checks the status of a catalog update
 */
exports.getStatus = function( ticket_id, callback ) {
  var url = config.ECHONEST_API_URL + 'tasteprofile/status?api_key='
    + config.ECHONEST_API_KEY + '&format=json&ticket=' + ticket_id;

  request.get({
    url : url
  }, function( err, r, body ) {
    var result;
    try {
      result = JSON.parse(body);
    } catch ( e ) {
      return callback(body);
    }
    var ticket_status = result.response.ticket_status;
    if ( ticket_status === 'complete' ) {
      return callback(null, true);
    } else if ( ticket_status == 'pending' ) {
      return callback(null, false);
    } else {
      return callback(body);
    }
  });
};

/*
 Sends a catalog file of formatted artist ids to Echonest
 */
exports.sendFile = function( catalog_file, catalog_id, callback ) {
  var url = config.ECHONEST_API_URL + 'tasteprofile/update';
  var form = {
    api_key : config.ECHONEST_API_KEY,
    format : 'json',
    id : catalog_id,
    data : JSON.stringify(catalog_file)
  };

  request.post({
    url : url,
    headers : {'content-type' : 'application/x-www-form-urlencoded'},
    form : form
  }, function( err, r, body ) {
    try {
      var result = JSON.parse(body);
    } catch ( e ) {
      return callback(body);
    }

    if ( result.response.status.code !== RESPONSE_CODES.VALID ) {
      return callback(result);
    }
    return callback(null, result.response.ticket);
  });

};

/* Generate a random name to give to a Catalog profile */
function generateRandomName() {
  return 'tasteprofile_' + Math.random().toString(36).slice(2);
}
