var chai = require('chai'),
    nock = require('nock');
process.env.NODE_ENV = 'test';

var app = require('../app/app'),
    request = require('supertest')(app);

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
  it('should load /concerts if user has authorized app');
});
