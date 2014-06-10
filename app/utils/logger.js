var winston = require('winston');

var colors = {
  'debug' : 'blue',
  'info' : 'green',
  'error' : 'red'
};

var logger = module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    }),
    new (winston.transports.File)({
      filename : __dirname + '/../../logs/concerts.log'
    })
  ],
  colors: colors
});
module.exports = logger;
