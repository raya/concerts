var chaiAsPromised = require('chai-as-promised'),
    config = require('../app/config/config'),
    nock = require('nock'),
    songkick = require('../app/utils/songkick'),
    _ = require('lodash');
chai.use(chaiAsPromised);

describe('Songkick', function() {
  describe('Getting metro ids', function() {
    var api,
        good_result,
        user_coordinates = { lat : 37.7, long : -122.26 };

    before(function() {
      api = nock(config.SONGKICK_API_URL)
        .get('/api/3.0/search/locations.json?location=geo:' + user_coordinates.lat + ','
          + user_coordinates.long + '&apikey=' + config.SONGKICK_API_KEY);
      good_result = {
        "resultsPage" : {
          "status" : "ok",
          "results" : {
            "location" : [
              {"metroArea" : {
                "lat" : 37.7599,
                "id" : 26330,
                "lng" : -122.437 }
              },
              {"metroArea" : {
                "lat" : 37.9599,
                "id" : 28529,
                "lng" : -122.937 }
              }
            ]}}};
    });
    it('should return a list of valid metro ids', function( done ) {
      api.reply(200, good_result);
      var promise = songkick.getMetroIdsAsync(user_coordinates);
      expect(promise).to.eventually.eql([ 26330, 28529 ])
        .and.notify(done);
    });
    it('should not include ids with latitude/longitude coordinates not near user coordinates', function( done ) {
      var bad_result = _.clone(good_result, true);
      var bad_location = {
        "metroArea" : {
          "lat" : 50.9599,
          "id" : 99999,
          "lng" : -157.937 }
      };
      bad_result.resultsPage.results.location.push(bad_location);
      api.reply(200, bad_result);
      var promise = songkick.getMetroIdsAsync(user_coordinates);
      expect(promise).to.eventually.not.contain(99999).and.notify(done);
    });
    it('should only include unique ids', function( done ) {
      var bad_result = _.clone(good_result, true);
      var dupe_location = {
        "metroArea" : {
          "lat" : 51,
          "id" : 26330,
          "lng" : -157.937 }
      };
      bad_result.resultsPage.results.location.push(dupe_location);
      api.reply(200, bad_result);
      var promise = songkick.getMetroIdsAsync(user_coordinates);
      expect(promise).to.eventually.eql([26330, 28529]).and.notify(done);
    });


  });

});