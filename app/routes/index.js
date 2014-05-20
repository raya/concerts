var Promise = require('bluebird'),
    rdio = Promise.promisifyAll(require('../utils/rdio'));

var echonest = Promise.promisifyAll(require('../utils/echonest'));
module.exports = function( app, passport ) {
  app.get('/', function( req, res, next ) {
    res.render('home');
  });

  app.post('/users/authorize', passport.authenticate('oauth2'));

  app.get('/users/authorize/rdio/callback',
    passport.authenticate('oauth2', {
      successRedirect : '/concerts',
      session : true }));

  app.get('/users/new', function( req, res ) {
    Promise.all([
      rdio.getArtistsAsync(req.session.passport.user.accessToken),
      echonest.createCatalogProfileAsync()
    ]).then(function( result ) {
      // response
    });
  });

  app.get('/concerts', function( req, res ) {
    if ( !req.user ) {
      return res.redirect('/');
    }
    res.render('concerts');
  });


};