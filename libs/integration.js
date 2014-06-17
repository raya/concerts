/*
 integration.js
 */
var _ = require('lodash');

// Return an array of concerts where the artist id in concerts matches
// an artist id in artist_ids.
exports.filterConcertMatches = function( artist_ids, concerts ) {
  var artist_id,
      artist_name,
      matches = [];

  for ( var i = 0; i < concerts.length; i++ ) {
    for ( var j = 0; j < concerts[i].performance.length; j++ ) {
      artist_id = String(concerts[i].performance[j].artist.id);
      artist_name = concerts[i].performance[j].artist.displayName;
      if ( artist_ids[artist_id] ) {
        matches.push(formatConcertData(artist_ids[artist_id], concerts[i]));
      }
    }
  }
  return matches;
};

// Saves necessary concert data to object
function formatConcertData( users_artist, concert ) {
  var entry = {};

  entry.location = concert.location;
  entry.start = concert.start;
  entry.type = concert.type;
  entry.uri = concert.uri;
  entry.users_artist = users_artist;
  entry.venue = concert.venue;
  return entry;
}