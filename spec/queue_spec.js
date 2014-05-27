var config = require( '../app/config/config'),
    kue = require('kue'),
    mockkue = require('mock-kue'),
    queue = require('../app/utils/queue'),
    request = require('request');

describe('queue', function() {
  describe('adding a job to poll echonest', function() {
    it('should add a job of type "catalog_update"', function() {
      expect(kue.jobCount()).to.equal(0);
      queue.addPollingJob('123', function() {});
      expect(kue.jobCount()).to.equal(1);
    });
  });
});