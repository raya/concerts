concerts
========

This app uses the Rdio, Echonest, and Songkick APIs to retrieve a list of 
nearby upcoming concerts for the artists in a user's Rdio collection.

Note: Data is only stored for 2 hours due to partner API restrictions.

[Demo](http://concerts.bitfraggle.com)

## Install
```
git clone https://github.com/rayalynn/concerts.git
cd concerts
npm install
bower install
grunt build
node app.js
```

## Tests
```
npm test
```

## Configure 
* Install [Redis](http://redis.io/)
* Configure redis settings + other environment variables in libs/config/config.js
