var chai = require( 'chai' );

global.chai = chai;
global.should = chai.should();
global.expect = chai.expect;

process.env.NODE_ENV = 'test';