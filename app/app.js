/*
 app.js
 */

var config = require('./config/config'),
    express = require('express'),
    http = require('http'),
    passport = require('passport');

var app = express();

//var APP_PORT = process.env.PORT || 5000;
if ( app.get('env') == 'test' ) {
  APP_PORT = 5001;
} else {
  APP_PORT = 5000;
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret:'hi'}));
app.use(express.errorHandler());

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// Bootstrap passport file
require( './config/passport' )( passport, config );
// Bootstrap routes
require('./routes/index')(app, passport);

app.use('/public', express.static(__dirname + '/public'));

http.createServer(app).listen(APP_PORT, function() {
  console.log('Server listening on port', APP_PORT);
  console.log('Environment:', app.get('env'));
});

module.exports = app;