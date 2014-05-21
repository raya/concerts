var chaiAsPromised = require('chai-as-promised'),
    config = require('../app/config/config'),
    echonest = require('../app/utils/echonest'),
    nock = require('nock');
chai.use(chaiAsPromised);

describe('Echonest', function() {

  describe('Creating a catalog profile', function() {
    var api;
    before(function() {
      api = nock(config.ECHONEST_API_URL)
        .filteringRequestBody(/api_key=[A-Z\d]*&name=[A-Z\d_]*/gi, 'api_key=TEST_KEY&name=TEST_NAME')
        .post('/api/v4/tasteprofile/create', 'api_key=TEST_KEY&name=TEST_NAME&format=json&type=artist');
    });
    it('should get a valid ticket ID from Echonest', function( done ) {
      api.reply(200, {
        response : { status : { version : '4.2', code : 0, message : 'Success' },
          type : 'artist',
          name : 'tasteprofile_random_name',
          id : 'TEST_TICKET_ID' } });
      var promise = echonest.createCatalogProfileAsync();
      expect(promise).to.eventually.equal('TEST_TICKET_ID').
        and.notify(done);
    });
    it('should reject if Echonest returns an invalid status code', function( done ) {
      api.reply(200,
        {"response" : {"status" : {"version" : "4.2", "code" : 1, "message" : "1|Invalid key: Unknown"}}});
      var promise = echonest.createCatalogProfileAsync();
      expect(promise).to.eventually.be.rejected.and.notify(done);
    });
  });

  describe('Creating a catalog data file', function() {
    it('format the data file', function() {
      var artists = [ 'r123', 'r456' ];
      var catalog = echonest.createCatalogDataFile( artists );
      var first_item = catalog[0];
      expect( first_item.item.item_id).to.equal('0');
      expect( first_item.item.artist_id).to.equal('rdio-US:artist:r123' );
      var second_item = catalog[1];
      expect( second_item.item.item_id).to.equal('1');
      expect( second_item.item.artist_id).to.equal('rdio-US:artist:r456' );
    });
    it('should return an empty array if there are no artists', function() {
      var catalog = echonest.createCatalogDataFile( [] );
      expect( catalog.length).to.equal(0);
    });
  });

});