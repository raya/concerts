var integration = require('../libs/integration');

describe('integration', function() {
  describe('matching concerts with artist ids', function() {
    var artist_ids, concerts;
    beforeEach(function() {
      artist_ids = {
        '100' : 'Artist 1',
        '101' : 'Artist 2',
        '102' : 'Artist 3',
        '103' : 'Modest Mouse'
      };
      concerts = [
        { type : 'Concert',
          displayName : 'Artist 1 + Artist 2 Concert',
          id : 8888,
          performance : [
            {
              artist : { identifier : [],
                id : 100,
                displayName : 'Artist 1' }},
            {
              id : 8889,
              artist : { identifier : [],
                id : 200,
                displayName : 'Non Followed Artist' }}
          ]},
        { type : 'Concert',
          displayName : 'Artist 3 Concert',
          id : 8889,
          performance : [
            { billing : 'headline',
              artist : { identifier : [],
                id : 102,
                displayName : 'Artist 3' }
            }
          ]}
      ];
    });
    it('should return matches', function() {
      var matches = integration.filterConcertMatches(artist_ids, concerts);
      expect(matches).to.have.length(2);
    });
    it('should return an empty array if there are no matches', function() {
      var no_match_artist_ids = {
        '500' : 'Artist 500',
        '501' : 'Artist 501'
      };
      var matches = integration.filterConcertMatches(no_match_artist_ids, concerts);
      expect(matches).to.be.empty;
    });
    it('should save a user\'s followed artist to users_artist', function() {
      var matches = integration.filterConcertMatches(artist_ids, concerts);
      expect(matches[0].users_artist).to.equal('Artist 1');
      expect(matches[1].users_artist).to.equal('Artist 3');
    });
    it('should save the correct users_artist when there are multiple performance objects', function() {
      var extra_performance = {
        billing : 'headline',
        artist : {
          identifier : [],
          id : 103,
          displayName : 'Modest Mouse'
        }
      };
      concerts[0].performance.push( extra_performance );
      var matches = integration.filterConcertMatches( artist_ids, concerts);
      expect(matches[0].users_artist).to.equal('Artist 1');
      expect(matches[1].users_artist).to.equal('Modest Mouse');
      expect(matches[2].users_artist).to.equal('Artist 3');
    });
  });

});
