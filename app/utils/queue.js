/*
  queue.js

  Job names:
  * catalog_update - polls echonest for ticket updates

 */
var config = require('../app/config/config'),
    echonest = require( './echonest'),
    kue = require('kue');

// Create jobs queue
var jobs = kue.createQueue({
  redis : {
    port : config.REDIS_IP,
    host : config.REDIS_IP
  }
});

var DELAY_INTERVAL = 2000, //check delayed jobs every 2 seconds
    DELAY_TIME = 1000,     //delay added jobs by 1 second
    MAX_ACTIVE_JOBS = 1,   //Max # of jobs to process at once
    MAX_ATTEMPTS = 20;     //Max # of tries to process job until marking it as failed

jobs.promote( DELAY_INTERVAL );

/*
  Process the catalog_update job.
 */
jobs.process( 'catalog_update', MAX_ACTIVE_JOBS, function( job, done ) {
  echonest.getStatus( job.data.ticket_id, function( result ) {
    if ( result ) {
      job.remove( function( err ) {
        if ( err ) { throw err; }
        done( null, true );
      })
    }
  });

});

/*
  Add job to poll echonest for a given ticket id
 */
exports.addPollingJob = function( ticket_id, callback ) {
  var job = jobs.create( 'catalog_update' )
    .delay( DELAY_TIME)
    .attempts( MAX_ATTEMPTS );

  jobs.on( 'complete', function( catalog_id ) {
    callback( null, job.data.catalog_id );
  }).on( 'failed', function( err ) {
    console.log('job failed');
    callback( err )
  });

  job.save();
};