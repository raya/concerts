/*
 app.js
 */

var config = require('./config'),
    express = require('express'),
    http = require('http');

var app = express(),
    routes = require('./routes/index')(app);

var APP_PORT = process.env.PORT || 5000;

app.use(express.logger());
app.use(express.bodyParser());
app.use(express.errorHandler());

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use('/public', express.static(__dirname + '/public'));

http.createServer(app).listen(APP_PORT, function() {
  console.log('Server listening on port', APP_PORT);
  console.log('Environment:', app.get('env'));
});