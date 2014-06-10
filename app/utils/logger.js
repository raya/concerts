var logger = require('winston');

logger.add( logger.transports.File,
  { filename : __dirname + '/../../logs/concerts.log'});
//logger.remove(logger.transports.Console);

module.exports = logger;

