var config = {};

config.development_port = 5000;
config.TEST_PORT = 5001;

// Kue
config.KUE_PORT = 4003;
// Redis
config.REDIS_IP = '127.0.0.1';
config.REDIS_PORT = '6379';
config.CONCERTS_SESSION_SECRET = process.env.CONCERTS_SESSION_SECRET;

// External API info
config.ECHONEST_API_KEY   = process.env.ECHONEST_API_KEY;
config.ECHONEST_API_URL   = 'http://developer.echonest.com/api/v4/';

config.RDIO_AUTHORIZATION_URL = 'https://www.rdio.com/oauth2/authorize';
config.RDIO_API_URL = 'https://www.rdio.com/api/1/';
config.RDIO_CALLBACK_URL = process.env.RDIO_CALLBACK_URL;
config.RDIO_CLIENT_ID = process.env.RDIO_CLIENT_ID;
config.RDIO_CLIENT_SECRET = process.env.RDIO_CLIENT_SECRET;
config.RDIO_TOKEN_URL = 'https://www.rdio.com/oauth2/token';
config.SONGKICK_API_KEY   = process.env.SONGKICK_API_KEY;
config.SONGKICK_API_URL   = 'http://api.songkick.com/api/3.0/';

module.exports = config;