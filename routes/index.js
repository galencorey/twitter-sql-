'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    var allTheTweets;
    client.query('SELECT content, name, pictureUrl, tweets.id FROM tweets JOIN users ON tweets.UserId = users.id ORDER BY tweets.id DESC LIMIT 8;', function(err, result){
       if (err) throw err;
        allTheTweets = result.rows;
        res.render('index', {
          title: 'Twitter.js',
          tweets: allTheTweets,
          showForm: true
    })
  })
}


  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var username = req.params.username;
    client.query('SELECT content, name, tweets.id, pictureUrl FROM tweets JOIN users ON tweets.UserId = users.id WHERE name=$1', [username], function(err, result){
        if (err) throw err;
        var tweetsForName = result.rows;
        console.log(result.rows)
        res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForName,
        showForm: true,
        username: req.params.username
    });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetID = req.params.id;
    client.query('SELECT content, name, tweets.id, pictureUrl FROM tweets JOIN users ON tweets.UserId = users.id WHERE tweets.id=$1', [tweetID], function(err, result){
      if (err) throw err;
      var tweetsWithThatId = result.rows;
      res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
    });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){

      client.query('SELECT name, users.id FROM users WHERE name=$1', [req.body.name], function(err, result){
        if (err) throw err;
        var user = result.rows;
          if (user[0]){
          client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2) RETURNING *', [user[0].id, req.body.content], function (erro, resul){
            if (erro) throw new Error('err2');
            console.log(resul.rows)
            io.sockets.emit('new_tweet', {name: req.body.name, content: req.body.content});
          });
        } else {
          client.query('INSERT INTO users (name) VALUES ($1, $2) RETURNING id, name', [req.body.name], function(error, resu){
            if (error) throw new Error('err3');
            var newUser = resu.rows;
            client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2)', [newUser[0].id, req.body.content], function (errorr, res1){
              if (errorr) throw errorr;
              io.sockets.emit('new_tweet', {name: newUser[0].name, content: req.body.content});
            })
            })
           }
        })
     res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
