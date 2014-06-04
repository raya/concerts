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

  describe('Getting concerts', function() {
    var api,
        end_date = '2014-06-10',
        metro_id = '5290',
        results = { resultsPage : { status : 'ok',
          results : { event : [
            { type : 'Concert',
              displayName : 'Radiohead',
              venue : { metroArea : [],
                displayName : 'The Club',
                id : 12100 } },
            { type : 'Concert',
              displayName : 'Modest Mouse',
              venue : { metroArea : [],
                displayName : 'The Club',
                id : 21200 } }
          ]},
          perPage : 50,
          page : 1,
          totalEntries : 2 }},
        start_date = '2014-06-03';

    before(function() {
      url = '/api/3.0/metro_areas/' + metro_id + '/calendar.json?'
        + '&apikey=' + config.SONGKICK_API_KEY
        + '&min_date=' + start_date + '&max_date=' + end_date;

      api = nock(config.SONGKICK_API_URL)
        .get(url);
    });
    it('should return a list of concerts', function( done ) {
      api.reply(200, results);
      var promise = songkick.getConcerts(metro_id, start_date, end_date);
      expect(promise).to.eventually.eql(results.resultsPage.results.event)
        .and.notify(done);
    });
    it('should get additional concerts if all events aren\'t included in initial response', function( done ) {
      var extra_results = _.clone(results, true);
      extra_results.resultsPage.totalEntries = 3;
      extra_results.resultsPage.perPage = 2;

      var page_two_results =
          { resultsPage : { status : 'ok',
            results : { event : [
              { type : 'Concert',
                displayName : 'The Eagles',
                venue : { metroArea : [],
                  displayName : 'The Club',
                  id : 32100 } }
            ]
            },
            perPage : 50,
            page : 2,
            totalEntries : 3 }};

      api.reply(200, extra_results)
        .get(url + '&page=2')
        .reply(200, page_two_results);

      var promise = songkick.getConcerts(metro_id, start_date, end_date);
      expect(promise).to.eventually.have.length(3)
        .and.to.deep.include.members(extra_results.resultsPage.results.event)
        .and.to.deep.include.members(page_two_results.resultsPage.results.event)
        .and.notify(done);
    });
  });
});