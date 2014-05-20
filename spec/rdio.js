var chaiAsPromised = require('chai-as-promised'),
    config = require('../app/config/config'),
    nock = require('nock'),
    parseUri = require('parseUri'),
    rdio = require('../app/utils/rdio');

chai.use(chaiAsPromised);

function formatUrl( url ) {
  var formatted = {};
  formatted.base_url = null;
  formatted.path = null;
  return formatted;
}

describe('rdio', function() {
  describe('Getting artist data', function() {
    var api;
    var parsed_url = parseUri( config.RDIO_API_URL),
        base_url = parsed_url.protocol + '://' + parsed_url.host,
        relative_dir = parsed_url.relative;
    before(function() {
      api = nock( base_url )
        .log(console.log)
    });
    it('should return a list of artist data', function( done ) {
        api.post( relative_dir, "method=getArtistsInCollection")
        .reply(200,
        { status : 'ok',
          result : [
            {
              name : 'Beastie Boys',
              artistKey : 'r123'
            },
            { name : 'The Beatles',
              artistKey : 'r592'}
          ]
        });
      var promise = rdio.getArtists('test_access_token');
      expect(promise).to.eventually.eql(['r123', 'r592'])
        .and.notify(done);
    });
    it('should reject if there is no access token');
    it('should reject the promise if rdio returns an error');
    it('should do something? if there are no artist ids');
  });
});





