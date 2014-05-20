var config = {};

config.development_port = 5000;
config.TEST_PORT = 5001;


// External API info
config.RDIO_AUTHORIZATION_URL = 'https://www.rdio.com/oauth2/authorize';
config.RDIO_API_URL = 'https://www.rdio.com/api/1/';
config.RDIO_CALLBACK_URL = 'http://127.0.0.1:5000/users/authorize/rdio/callback';
config.RDIO_CLIENT_ID = process.env.RDIO_CLIENT_ID;
config.RDIO_CLIENT_SECRET = process.env.RDIO_CLIENT_SECRET;
config.RDIO_TOKEN_URL = 'https://www.rdio.com/oauth2/token';

module.exports = config;