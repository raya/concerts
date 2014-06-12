/*
 app.js
 */

var config = require('./config/config'),
    express = require('express'),
    http = require('http'),
    kue = require( 'kue'),
    passport = require('passport'),
    RedisStore = require('connect-redis')(express);

var app = express(),
    port = Number(process.env.PORT || 5000);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({
    store : new RedisStore({
      host : config.REDIS_IP,
      port : config.REDIS_PORT,
      prefix : 'sess',
      ttl : 7200 // 7200 seconds = 2 hours
    }),
    cookie : { maxAge : (3600000 * 2 ) }, //3600000ms * 2 = 2 hours
    secret : config.CONCERTS_SESSION_SECRET
  }));

app.use(express.errorHandler());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// Start Kue interface
kue.app.listen( config.KUE_PORT );

// Bootstrap passport file
require( './config/passport' )( passport, config );
// Bootstrap routes
require('./routes/index')(app, passport);

app.use('/public', express.static(__dirname + '/public'));

http.createServer(app).listen(port, function() {
  console.log('Server listening on port', port);
  console.log('Environment:', app.get('env'));
});

module.exports = app;