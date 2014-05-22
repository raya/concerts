var chaiAsPromised = require('chai-as-promised'),
    config = require('../app/config/config'),
    echonest = require('../app/utils/echonest'),
    _ = require('lodash'),
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

  describe('Creating a catalog file', function() {
    it('format the data file', function() {
      var artists = [ 'r123', 'r456' ];
      var catalog = echonest.createCatalogDataFile(artists);
      var first_item = catalog[0];
      expect(first_item.item.item_id).to.equal('0');
      expect(first_item.item.artist_id).to.equal('rdio-US:artist:r123');
      var second_item = catalog[1];
      expect(second_item.item.item_id).to.equal('1');
      expect(second_item.item.artist_id).to.equal('rdio-US:artist:r456');
    });
    it('should return an empty array if there are no artists', function() {
      var catalog = echonest.createCatalogDataFile([]);
      expect(catalog.length).to.equal(0);
    });
  });

  describe('Sending a catalog file', function() {
    var api,
        catalog_file,
        catalog_id;
    before(function() {
      api = nock(config.ECHONEST_API_URL)
        .filteringRequestBody(/.*/, '*')
        .post('/api/v4/tasteprofile/update', '*');
      catalog_id = 1;
      catalog_file = [
        { item : {
          0 : {
            item_id : 0,
            artist_id : 'rdio-US:artist:123'
          }
        }}
      ];
    });
    it('should return a ticket id if successful', function() {
      api.reply(200, {"response" : {"status" : {"version" : "4.2", "code" : 0, "message" : "Success"},
        "ticket" : "CAGXIQJ1ZZ1FA346FE28"}
      });
      var promise = echonest.sendFileAsync(catalog_file, catalog_id);
      expect(promise).to.eventually.equal('CAGXIQJ1ZZ1FA346FE28');
    });
    it('should return an error if the response was invalid', function( done ) {
      api.reply(200, {"response" : {"status" : {"version" : "4.2", "code" : 4,
        "message" : "limit - Missing Parameter: a \"name\" or \"id\" must be provided"}
      }});
      var promise = echonest.sendFileAsync(catalog_file, catalog_id);
      expect(promise).to.eventually.be.rejected.and.notify(done);
    });
  });

  describe('Checking catalog status', function() {
    var api,
        ticket_id = '293493';
    before(function() {
      api = nock(config.ECHONEST_API_URL)
        .get('/api/v4/tasteprofile/status?api_key=' + config.ECHONEST_API_KEY +
          '&format=json&ticket=' + ticket_id);
    });
    it('should return true if processing is complete', function( done ) {
      api.reply(200,
        {
          "response" : {
            "status" : {
              "code" : 0,
              "message" : "Success",
              "version" : "4.2"
            },
            "ticket_status" : "complete",
            "total_items" : 21,
            "items_updated" : 21,
            "percent_complete" : 100,
            "update_info" : [
              { "item_id" : "1", "info" : " lookup failed"},
              { "item_id" : "3", "info" : "bad value"},
              { "item_id" : "8", "info" : "couldn't resolve item"}
            ]
          }
        });

      var promise = echonest.getStatusAsync(ticket_id);
      expect(promise).to.eventually.be.fulfilled.
        and.equal(true).and.notify(done);
    });
    it('should return false if processing is not yet finished', function( done ) {
      api.reply(200, {
        "response" : {
          "status" : {
            "code" : 0,
            "message" : "Success",
            "version" : "4.2"
          },
          "ticket_status" : "pending"
        }});
      var promise = echonest.getStatusAsync(ticket_id);
      expect(promise).to.eventually.equal(false).and.notify(done);
    });
    it('should return an error if the catalog couldn\t be processed', function( done ) {
      api.reply(200, {
        "response" : {
          "status" : {
            "code" : 0,
            "message" : "Success",
            "version" : "4.2"
          },
          "ticket_status" : "error",
          "details" : "too many items in tasteprofile"
        }});
      var promise = echonest.getStatusAsync(ticket_id);
      expect(promise).to.eventually.be.rejected.and.notify(done);
    });
  });
  describe('retrieving a completed catalog', function() {
    var api,
        catalog_id = 'CXZ1';
    before(function() {
      var url = '/api/v4/tasteprofile/read?api_key='
        + config.ECHONEST_API_KEY
        + '&format=json&bucket=id:songkick'
        + '&bucket=hotttnesss' //Bug? - Echonest won't return songkick IDs without this
        + '&results=1000'
        + '&id=' + catalog_id;
      api = nock(config.ECHONEST_API_URL)
        .get(url);
    });
    it('should return items in the correct format', function( done ) {
      var response = {
        "response" : {
          "status" : {
            "version" : "4.2",
            "code" : 0,
            "message" : "Success"
          },
          "catalog" : {
            "name" : "tasteprofile_kf1crvvs050tqpvi",
            "items" : [
              {
                "artist_name" : "Various Artists",
                "request" : {
                  "item_id" : "0",
                  "artist_id" : "rdio-US:artist:r62"
                }
              },
              {
                "artist_name" : "2Pac",
                "foreign_id" : "CAEXEXG14620411F98:artist:1",
                "foreign_ids" : [
                  {
                    "catalog" : "songkick",
                    "foreign_id" : "songkick:artist:40585"
                  }
                ],
                "request" : {
                  "item_id" : "1",
                  "artist_id" : "rdio-US:artist:r66033"
                }
              }
            ]
          }
        }};
      api.reply(200, response);
      var promise = echonest.readProfileDataAsync(catalog_id);
      expect(promise).to.eventually.be.fulfilled.then(function( result ) {
        expect(_.size(response)).to.equal(1);
        expect(result[ '40585' ]).to.equal('2Pac');
      }).should.notify(done);
    });
    it('should return an error if code is not valid', function( done ) {
      var response = {
        "response" : {
          "status" : {
            "version" : "4.2",
            "code" : -1,
            "message" : "Success"
          }}};
      api.reply( 200, response );
      var promise = echonest.readProfileDataAsync( catalog_id );
      expect( promise).to.eventually.be.rejected.and.notify(done);
    });
    it('should make additional calls if all items aren\'t returned' );
  });
});
