var config = require('./config/config'),
    logger = require('./logger'),
    request = require('request'),
    _ = require('lodash');

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
      logger.log('error', 'Error creating catalog profile: %j', err);
      return callback(err);
    }
    try {
      var result = JSON.parse(body);
    } catch ( e ) {
      logger.log('error', 'Error parsing JSON for catalog profile: %j', err);
      logger.log('error', 'Body: %j', body);
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
 Delete a catalog
 */
exports.deleteCatalog = function( catalog_id, callback ) {
  var url = config.ECHONEST_API_URL + 'tasteprofile/delete',
      form = {
        api_key : config.ECHONEST_API_KEY,
        id : catalog_id
      };

  request.post({
    url : url,
    headers : {'content-type' : 'application/x-www-form-urlencoded'},
    json : true,
    form : form
  }, function( err, r, body ) {
    if ( err ) {
      logger.log('error', 'Error deleting catalog profile: %j', err);
      return callback(err);
    }
    var ticket_status = body.response.status.code;
    if ( ticket_status !== RESPONSE_CODES.VALID ) {
      return callback(body);
    } else {
      return callback(null, true);
    }
  });
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
    if ( err ) {
      logger.log('error', 'Error getting catalog update status: %j', err);
      return callback(err);
    }
    var result;
    try {
      result = JSON.parse(body);
    } catch ( e ) {
      logger.log('error', 'Error parsing JSON while retrieving catalog status: %j', err);
      logger.log('error', 'Body: %j', body);
      return callback(body);
    }
    var ticket_status = result.response.ticket_status;
    logger.log('info', 'Ticket received from Echonest for ticket_id %s, status: %s', ticket_id, ticket_status );
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
    if ( err ) {
      logger.log('error', 'Error sending Echonest artist data file: %j', err);
      logger.log('error', 'Body: %j', body);
      return callback(err);
    }
    try {
      var result = JSON.parse(body);
    } catch ( e ) {
      logger.log('error', 'Error parsing JSON while sending artist data file: %j', err);
      logger.log('error', 'Body: %j', body);
      return callback(body);
    }

    if ( result.response.status.code !== RESPONSE_CODES.VALID ) {
      return callback(result);
    }
    return callback(null, result.response.ticket);
  });
};

exports.readProfileData = function( catalog_id, callback ) {
  var url = config.ECHONEST_API_URL + 'tasteprofile/read?api_key='
    + config.ECHONEST_API_KEY
    + '&format=json&bucket=id:songkick&bucket=hotttnesss&results=1000'
    + '&id=' + catalog_id;

  request.get({
    url : url
  }, function( err, r, body ) {
    if ( err ) {
      logger.log('error', 'Error reading Echonest profile data: %j', err);
      logger.log('error', 'Body: %j', body);
      return callback(err);
    }
    var result;
    try {
      result = JSON.parse(body);
    } catch ( e ) {
      return callback(e);
    }
    if ( result.response.status.code !== RESPONSE_CODES.VALID ) {
      return callback(body);
    }
    var items = formatProfileData(result.response.catalog.items);
    return callback(null, items);

  });
};

// TODO - add maximum number of tries
// Repeatedly reload the request object to see if req.artists has been set
exports.pollData = function( req, callback ) {
  var timer = setInterval(function() {
    req.session.reload(function( err ) {
      if ( err ) {
        logger.log('error', 'Error reloading session data while polling for echonest artists: %j', err );
      }

      if ( req.session.artists ) {
        clearInterval(timer);
        return callback(null, true);
      }
    });
  }, 2000);
};

/* Format catalog data from echonest
 * Remove the foreign_id : songkick:artist:ID_NUM from items and
 * returns them in a hash:
 * { songkick_id : artist_name }
 * */
function formatProfileData( artists ) {
  var songkick_ids = {},
      formattedId;

  _.forEach(artists, function( artist ) {
    if ( artist.foreign_ids ) {
      _.forEach(artist.foreign_ids, function( id ) {
        if ( id.catalog === 'songkick' ) {
          formattedId = strip(id.foreign_id);
          songkick_ids[formattedId] = artist.artist_name;
        }
      });
    }
  });

  return songkick_ids;
}

/* Remove the songkick:artist: prefix before the ID #
 */
function strip( name ) {
  var index = name.lastIndexOf(':');
  return name.substring(index + 1, name.length);
}

/* Generate a random name to give to a Catalog profile */
function generateRandomName() {
  return 'tasteprofile_' + Math.random().toString(36).slice(2);
}
