var OAuth2Strategy = require( 'passport-oauth2' );

module.exports = function( passport, config ) {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  passport.use(new OAuth2Strategy({
    authorizationURL : config.RDIO_AUTHORIZATION_URL,
    tokenURL : config.RDIO_TOKEN_URL,
    clientID : config.RDIO_CLIENT_ID,
    clientSecret : config.RDIO_CLIENT_SECRET,
    callbackURL : config.RDIO_CALLBACK_URL
  },
  function( accessToken, refreshToken, profile, done ) {
    console.log( 'passport callback' );
    console.log( arguments );
    if ( accessToken && refreshToken ) {
      var user = {};
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      return done( null, user );
    } else { return done( null, false );}
  }
));
};