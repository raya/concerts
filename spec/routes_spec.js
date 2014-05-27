var request = require('supertest')(app);

describe('routes', function() {
  describe('/concerts', function() {
    it('should redirect to home if user has not authorized app', function() {
      request
        .get('/concerts')
        .expect(302)
        .end(function( err, res ) {
          if ( err ) {
            throw err;
          }
        });
    });
    it('should load /concerts if user has authorized app', function( done ) {
      passportStub.login({ username : 'test' });
      request
        .get('/concerts')
        .expect(200)
        .end(function( err, res ) {
          if ( err ) {
            throw err;
          }
          passportStub.logout();
          done();
        });
    });
  });
  describe('/users/new', function() {

  });
});
