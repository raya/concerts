var chaiAsPromised = require('chai-as-promised'),
    config = require('../app/config/config'),
    nock = require('nock'),
    parseUri = require('parseUri'),
    rdio = require('../app/utils/rdio');

chai.use(chaiAsPromised);

describe('rdio', function() {
  describe('Getting artist data', function() {
    var api,
        is_demo_user;
    var parsed_url = parseUri(config.RDIO_API_URL),
        base_url = parsed_url.protocol + '://' + parsed_url.host,
        relative_dir = parsed_url.relative;
    before(function() {
      api = nock(base_url)
    });
    describe('Logged in rdio users', function() {
      before(function() {
        is_demo_user = false;
      });

      it('should return a list of artist data', function( done ) {
        api.post(relative_dir, "method=getArtistsInCollection")
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
        var promise = rdio.getArtistsAsync(is_demo_user, 'test_access_token');
        expect(promise).to.eventually.eql(['r123', 'r592'])
          .and.notify(done);
      });
      it('should reject the promise if the access token is invalid', function( done ) {
        api.post(relative_dir, "method=getArtistsInCollection")
          .reply(401, {"error_description" : "Invalid or expired access token", "error" : "invalid_token"});
        var promise = rdio.getArtistsAsync(is_demo_user, 'invalid_token');
        expect(promise).to.eventually.be.rejected.and.notify(done);
      });
    });
    describe('Demo users', function() {
      before(function() {
        is_demo_user = true;
      });
      it('should return a list of artist data', function( done ) {
        var promise = rdio.getArtistsAsync(is_demo_user, false);
        expect(promise).to.eventually.be.instanceof(Array)
          .and.to.have.length.of.at.least(1)
          .and.notify(done);
      });
    });
  });
});
