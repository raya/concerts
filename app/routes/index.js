var Promise = require('bluebird'),
    queue = require( '../utils/queue' );

var echonest = Promise.promisifyAll(require('../utils/echonest')),
    rdio = Promise.promisifyAll(require('../utils/rdio'));;
module.exports = function( app, passport ) {
  app.get('/', function( req, res, next ) {
    res.render('home');
  });

  app.post('/users/authorize', passport.authenticate('oauth2'));

  app.get('/users/authorize/rdio/callback',
    passport.authenticate('oauth2', {
      successRedirect : '/concerts',
      session : true }));

  /*
   1 - Get list of user's artists from Rdio & create a profile on Echonest
   2 - Create a file of artists to send to Echonest
   */
  app.get('/users/new', function( req, res ) {
    Promise.all([
      rdio.getArtistsAsync(req.session.passport.user.accessToken),
      echonest.createCatalogProfileAsync()
    ]).spread(function( artists, catalog_id ) {
      //TODO - Handle user not having artists
      req.session.catalog_id = catalog_id;
      req.session.save();
      var catalog_file = echonest.createCatalogDataFile(artists);
      return echonest.sendFileAsync(catalog_file, catalog_id);
    }).then(function( ticket_id ) {
      return new Promise( function( resolve, reject ) {
        queue.addPollingJob( ticket_id, resolve );
      });
    }).then( function() {
      return echonest.readProfileDataAsync(req.session.catalog_id);
    })
      .then( function( results ) {
        console.log( 'results from echonest:', results );

      });
  });

  app.get('/concerts', function( req, res ) {
    if ( !req.user ) {
      return res.redirect('/');
    }
    res.render('concerts');
  });


};