var client = {},
    options = {
      desiredCapabilities : {
        browserName : 'chrome'
      }
    },
    webdriverjs = require('webdriverjs');


describe('concerts page', function() {
  before(function( done ) {
    passportStub.login({username : 'test'});
    client = webdriverjs.remote(options);
    client.init();
    client.url('http://localhost:5001/concerts', done);
  });

  describe('content', function() {
    it('has the correct data', function( done ) {
      client
        .getTitle(function( err, title ) {
          expect(err).to.be.null;
          expect(title).to.equal('Concerts');
        })
        .elements('form', function( err, result ) {
          expect(err).to.be.null;
          expect(result.value.length).to.equal(2);
          done();
        });
    });
    it('has google maps', function( done ) {
      client
        .waitFor('.gm-style', 10000, function( err, result ) {
          expect(err).to.be.null;
          expect(result.state).to.equal('success');
          done();
        });
    });
  });

  describe('changing the city', function() {
    var inputField = 'input[name="city"]',
        submitBtn = 'button[name="citySubmitBtn"]';
    it('should not allow invalid inputs', function( done ) {
      client
        .setValue(inputField, ' ', function( err ) {
          expect(err).to.be.null;
        })
        .buttonClick(submitBtn)
        .getText('.error-msg', function( err, result ) {
          expect(err).to.be.null;
          expect(result).to.equal('Form cannot be blank');
        })
        .setValue(inputField, 'zksjilkjx')
        .buttonClick(submitBtn)
        .pause(1000)
        .getText('.error-msg', function( err, result ) {
          expect(result).to.equal('We can\'t find this city. Try again');
          done();
        })
    });
    it('should reorient the map for valid inputs', function( done ) {
      var uniqueUrls = [];
      client
        .waitFor('//img[contains(@src, "http://maps.googleapis.com/maps/api/js/StaticMapService.")]', 4000 )
        .getAttribute('//img[contains(@src, "http://maps.googleapis.com/maps/api/js/StaticMapService.")]',
        'src',
        function( err, result ) {
          expect(err).to.be.null;
          expect(result).not.to.be.null;
          uniqueUrls.push(result);
        })
        .setValue(inputField, 'Montreal, Canada')
        .buttonClick(submitBtn)
        .pause(4000) //Wait for google maps to reload
        .getAttribute('//img[contains(@src, "http://maps.googleapis.com/maps/api/js/StaticMapService.")]', 'src', function( err, result ) {
          expect(err).to.be.null;
          expect(result).not.to.be.null;
          uniqueUrls.push(result);
          expect(uniqueUrls[0]).not.to.equal(uniqueUrls[1]);
          done();
        });
    });
  });
  after(function() {
    passportStub.logout();
    client.end();
  });
});
