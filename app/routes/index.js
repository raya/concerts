module.exports = function( app, passport ) {
  app.get('/', function( req, res, next ) {
    res.render('home');
  });

  app.post('/users/authorize', passport.authenticate('oauth2'));

  app.get('/users/authorize/rdio/callback',
    passport.authenticate('oauth2', {
      successRedirect : '/concerts',
      session : true }));

  app.get( '/concerts', function( req, res ) {
    if ( !req.user ) {
      return res.redirect( '/' );
    }
    res.render( 'concerts' );
  });

};