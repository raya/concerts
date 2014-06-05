/*
 integration.js
 */

// Return an array of concerts where the artist id in concerts matches
// an artist id in artist_ids.
// users_artist key is set to the artist the user selected
exports.filterConcertMatches = function( artist_ids, concerts ) {
  var matches = [];
  for ( var i = 0; i < concerts.length; i++ ) {
    for ( var j = 0; j < concerts[i].performance.length; j++ ) {
      var artist_id = String(concerts[i].performance[j].artist.id);
      if ( artist_ids[artist_id] ) {
        concerts[i].users_artist = concerts[i].performance[j].artist.displayName;
        matches.push(concerts[i]);
      }
    }
  }
  return matches;
};

