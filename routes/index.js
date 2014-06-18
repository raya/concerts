var integration = require('../libs/integration'),
    logger = require('../libs/logger'),
    Promise = require('bluebird'),
    queue = require('../libs/queue'),
    _ = require('lodash');

var echonest = Promise.promisifyAll(require('../libs/echonest')),
    rdio = Promise.promisifyAll(require('../libs/rdio')),
    songkick = Promise.promisifyAll(require('../libs/songkick'));

module.exports = function( app, passport ) {

  app.post('/users/authorize', passport.authenticate('oauth2'));
  app.post('/users/demo', function( req, res ) {
    req.session.is_demo_user = true;
    req.session.save();
    res.redirect('/concerts');
  });

  app.get('/users/authorize/rdio/callback',
    passport.authenticate('oauth2', {
      session : true }),
    function( req, res ) {
      logger.log('info', 'Rdio authentication succesful');
      res.redirect('/concerts');
    });

  app.get('/users/new', function( req, res, next ) {
      logger.log('info', 'route hit: /users/new');
      var access_token = req.session.passport.user ? req.session.passport.user.accessToken : false;
      Promise.all([
        rdio.getArtistsAsync(req.session.is_demo_user, access_token) ,
        echonest.createCatalogProfileAsync()
      ])
        .spread(function( artists, catalog_id ) {
          logger.log('info', 'Rdio artist list retrieved. Echonest Catalog profile created. catalog_id: ', catalog_id);
          req.session.catalog_id = catalog_id;
          req.session.save();
          var catalog_file = echonest.createCatalogDataFile(artists);
          return echonest.sendFileAsync(catalog_file, catalog_id);
        })
        .then(function( ticket_id ) {
          logger.log('info', 'Adding polling job');
          return new Promise(function( resolve, reject ) {
            queue.addPollingJob(ticket_id, resolve);
          });
        })
        .then(function() {
          return echonest.readProfileDataAsync(req.session.catalog_id);
        })
        .then(function( results ) {
          req.session.reload(function() {
            req.session.artists = results;
            req.session.save();
            logger.log('info', 'Echonest artist data saved');
            logger.log('info', 'route : Deleting catalog id', req.session.catalog_id);
            echonest.deleteCatalogAsync(req.session.catalog_id);
          });
        })
        .catch(function( err ) {
          logger.log('error', 'Error in route /users/new', err);
          res.end(500);
          return next();
        });
    }
  );

  app.get('/events', function( req, res, next ) {
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
          logger.log('info', 'Songkick concert data saved');
        });
      })
      .then(function() {
        return echonest.pollDataAsync(req);
      })
      .then(function() {
        var matching_concerts = integration.filterConcertMatches(req.session.artists, req.session.concerts);
        logger.log('info', 'Artist-Concert matches success. Sending data to client.');
        res.json(matching_concerts);
      })
      .catch(function( err ) {
        logger.log('error', 'Error in route /events', err);
        res.end(500);
        return next();
      });
  });

// ---Pages
  app.get('/', function( req, res, next ) {
    res.render('home');
  });

  app.get('/about', function( req, res ) {
    res.render('about');
  });

  app.get('/concerts', function( req, res ) {
    if ( !req.user && !req.session.is_demo_user ) {
      return res.redirect('/');
    }
    res.render('concerts');
  });
};