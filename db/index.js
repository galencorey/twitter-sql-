var pg = require('pg');
var postgresUrl = 'postgres://localhost/twitterdb';
var client = new pg.Client(postgresUrl);


client.connect(function (err) {
  if (err) throw err;
});

module.exports = client;
