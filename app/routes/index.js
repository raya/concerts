var integration = require('../utils/integration'),
    logger = require('../utils/logger'),
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
      session : true }),
    function( req, res ) {
      logger.log('info', 'Rdio authentication succesful');
      res.redirect('/concerts');
    });

  app.get('/users/new', function( req, res ) {
      logger.log('info', 'route hit: /users/new');
      Promise.all([
        rdio.getArtistsAsync(req.session.passport.user.accessToken),
        echonest.createCatalogProfileAsync()
      ])
        .catch(function( err ) {
          logger.log('error', 'Error getting Rdio artist list or creating Echonest Profile : %j', err);
        }).
        spread(function( artists, catalog_id ) {
          logger.log('info', 'Rdio artist list retrieved. Echonest Catalog profile created. catalog_id: ', catalog_id);
          //TODO - Handle user not having artists
          req.session.catalog_id = catalog_id;
          req.session.save();
          var catalog_file = echonest.createCatalogDataFile(artists);
          return echonest.sendFileAsync(catalog_file, catalog_id);
        }).catch(function( err ) {
          logger.log('error', 'Error sending Echonest file: %j', err);
        })
        .then(function( ticket_id ) {
          return new Promise(function( resolve, reject ) {
            queue.addPollingJob(ticket_id, resolve);
          });
        }).catch(function( err ) {
          logger.log('error', 'Error polling for Echonest ticket id ', err );
        })
        .then(function() {
          return echonest.readProfileDataAsync(req.session.catalog_id);
        })
        .catch(function( err ) {
          logger.log('error', 'Error reading echonest profile data: %j', err);
        })
        .then(function( results ) {
          req.session.reload(function() {
            req.session.artists = results;
            req.session.save();
            logger.log('info', 'Echonest artist data saved');
            logger.log('info', 'route : Deleting catalog id', req.session.catalog_id);
            echonest.deleteCatalogAsync(req.session.catalog_id);
          });
        });
    }
  );

  app.get('/events', function( req, res ) {
    songkick.getMetroIdsAsync(req.query.user_coordinates)
      .catch(function( err ) {
        logger.log('error', 'Error retrieving Songkick Metro ids:', err);
      })
      .then(function( metro_ids ) {
        return Promise.map(metro_ids, function( metro_id ) {
          return songkick.getConcerts(metro_id);
        });
      })
      .catch(function( err ) {
        logger.log('error', 'Error retrieving Songkick concerts:', err);
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
      .catch(function( err ) {
        logger.log('err', 'Error getting Echonest data in Songkick route %j:', err);
      })
      .then(function() {
        var matching_concerts = integration.filterConcertMatches(req.session.artists, req.session.concerts);
        logger.log('info', 'Artist-Concert matches success. Sending data to client.');
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
}
;