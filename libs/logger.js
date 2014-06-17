var winston = require('winston');

var colors = {
  'debug' : 'blue',
  'info' : 'green',
  'error' : 'red'
},
  LOG_FILE = './logs/concerts.log';

var logger = module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    }),
    new (winston.transports.File)({
      filename : LOG_FILE
    })
  ],
  colors: colors
});

if ( process.env.NODE_ENV !== 'development' ) {
  logger.remove( winston.transports.Console );
}

module.exports = logger;
