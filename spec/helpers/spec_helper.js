var chai = require( 'chai' );

global.should = chai.should();
global.expect = chai.expect;

process.env.NODE_ENV = 'test';