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
      var promise = echonest.createCatalogProfile();
      expect(promise).to.eventually.equal('TEST_TICKET_ID').
        and.notify(done);
    });
    it('should reject if Echonest returns an invalid status code', function( done ) {
      api.reply(200,
        {"response" : {"status" : {"version" : "4.2", "code" : 1, "message" : "1|Invalid key: Unknown"}}});
      var promise = echonest.createCatalogProfile();
      expect(promise).to.eventually.be.rejected.and.notify(done);
    });
  });

});