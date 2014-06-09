var integration = require('../utils/integration'),
    Promise = require('bluebird'),
    queue = require('../utils/queue'),
    _ = require('lodash');

var echonest = Promise.promisifyAll(require('../utils/echonest')),
    rdio = Promise.promisifyAll(require('../utils/rdio')),
    songkick = Promise.promisifyAll(require('../utils/songkick'));

module.exports = function( app, passport ) {

  app.post('/users/authorize', passport.authenticate('oauth2'));

  app.get('/users/authorize/rdio/callback',
    passport.authenticate('oauth2', {
      successRedirect : '/concerts',
      session : true }));

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
      return new Promise(function( resolve, reject ) {
        queue.addPollingJob(ticket_id, resolve);
      });
    }).then(function() {
      return echonest.readProfileDataAsync(req.session.catalog_id);
    })
      .then(function( results ) {
        req.session.reload(function() {
          req.session.artists = results;
          req.session.save();
          console.log("Echonest artist data has been saved");
          echonest.deleteCatalogAsync(req.session.catalog_id);
        });
      });
  });

  app.get('/events', function( req, res ) {
    songkick.getMetroIdsAsync(req.query.user_coordinates)
      .then(function( metro_ids ) {
        return Promise.map(metro_ids, function( metro_id ) {
          return songkick.getConcerts(metro_id);
        });
      })
      .then(function( results ) {
        req.session.reload(function() {
          req.session.concerts = _.flatten(results, true);
          req.session.save();
          console.log('songkick concert data has been saved');
        });
      })
      .then(function() {
        return echonest.pollDataAsync(req);
      })
      .then(function() {
        var matching_concerts = integration.filterConcertMatches(req.session.artists, req.session.concerts);
        console.log('sending back Concert-Artist Matches.');
        res.json(matching_concerts);
      });
  });

// ---Pages
  app.get('/', function( req, res, next ) {
    res.render('home');
  });

  app.get('/concerts', function( req, res ) {
    if ( !req.user ) {
      return res.redirect('/');
    }
    res.render('concerts');
  });
};