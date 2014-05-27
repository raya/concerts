process.env.NODE_ENV = 'test';
var app = require( '../../app/app' );
var chai = require('chai');

global.app = app;
global.chai = chai;
global.should = chai.should();
global.expect = chai.expect;

// Mock for passport oAuth login
var passportStub = require( '../helpers/passport_stub');
passportStub.install( app );
global.passportStub = passportStub;
