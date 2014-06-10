/*
 queue.js

 Job names:
 * catalog_update - polls echonest for ticket updates

 */
var config = require('../config/config'),
    kue = require('kue'),
    logger = require('./logger.js');
Promise = require('bluebird');

var echonest = Promise.promisifyAll(require('./echonest'));

// Create jobs queue
var jobs = kue.createQueue({
  redis : {
    port : config.REDIS_IP,
    host : config.REDIS_IP
  },
  disableSearch : true
});

var DELAY_INTERVAL = 3000, //check delayed jobs every 3 seconds
    DELAY_TIME = 2000,     //delay added jobs by 2 seconds
    MAX_ACTIVE_JOBS = 1,   //Max # of jobs to process at once
    MAX_ATTEMPTS = 20;     //Max # of tries to process job until marking it as failed

// Check for delayed jobs and promote if delay time is over
jobs.promote(DELAY_INTERVAL);

/*
 Process the catalog_update job.
 */
jobs.process('catalog_update', MAX_ACTIVE_JOBS, function( job, done ) {
  echonest.getStatusAsync(job.data.ticket_id, function( err ) {
    if ( err ) {
      logger.log('error', 'Error getting Echonest catalog status: %j', err);
      done(err);
    } else {
      job.remove(function( err ) {
        if ( err ) {
          logger.log('error', 'Error removing catalog_update job: %j', err);
          throw err;
        }
        done(null, true);
      });
    }
  });
});

/*
 Add job to poll echonest for a given ticket id
 */
exports.addPollingJob = function( ticket_id, callback ) {
  var job = jobs.create('catalog_update',
    { ticket_id : ticket_id }
  )
    .delay(DELAY_TIME)
    .attempts(MAX_ATTEMPTS);

  job.on('complete', function() {
    logger.log('info', 'catalog_update job successful for job ticket id: %s', job.data.ticket_id);
    callback(null, job.data.catalog_id);
  }).on('failed', function( err ) {
    logger.log('error', 'catalog_update job failed: %j', err);
    callback(err)
  });

  job.save();
};