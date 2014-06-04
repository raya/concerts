/*
  integration.js
 */

// Return an array of concerts where the artist id in concerts matches
// an artist id in artist_ids.
exports.filterConcertMatches = function( artist_ids, concerts ) {
  var matches = [];
  for ( var i = 0; i < concerts.length; i++ ) {
    for ( var j = 0; j < concerts[i].performance.length; j++ ) {
      var artist_id = String(concerts[i].performance[j].artist.id);
      if ( artist_ids[artist_id] ) {
        matches.push( concerts[i]);
      }
    }
  }
  return matches;
};
