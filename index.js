"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');

// Start your server with this command to make it go to production mode.
//    NODE_ENV=production node index.js
const NODE_ENV = process.env.NODE_ENV || "development";
const knexConnectionInfo = require('../knexfile')[NODE_ENV];
console.log("Connecting to database...")
const knex = require('knex')(knexConnectionInfo);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/../public"));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/../views');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.get('/', function(req, res) {
  var loggedin = false;
  if (req.session.userId) {
    loggedin = true;
  }
  console.log('loggedin is ', loggedin);
  res.render('index', {loggedin: loggedin});
});

app.get('/users/:id', function(req, res) {
  knex.select().from('users').innerJoin('maps', 'users.id', 'user_id').where('users.id', req.params.id)
  .then(function(users) {
    res.render('user.html')
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

// Example user loaded // no login
app.get('/api/users/:id', function(req, res) {
  knex.select().from('users').innerJoin('maps', 'users.id', 'user_id').where('users.id', req.params.id)
  .then(function (users) {
    res.json(users);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

app.get('/logout', function (req, res) {
  req.session = null;
  res.redirect('/');
  console.log('logged out user');
});

app.get('/login', function(req, res) {
  req.session.userId = 3;
  console.log('logged in');
  res.redirect('/');
});

app.get('/api/locations/:id', function(req, res) {
  knex.select().from('locations').where('user_id', req.params.id)
  .then(function (locations) {
    res.json(locations);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

app.get('/api/location/:id', function(req, res) {
  knex.select().from('locations').where('id', req.params.id)
  .then(function (locations) {
    res.json(locations);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});


app.get('/api/maps/:id', function(req, res) {
  knex.select().from('maps').where('id', req.params.id)
  .then(function(maps) {
    res.json(maps);
    console.log(maps);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

// Select LIMIT one (autoselected) map for a user
app.get('/api/users/:id/singlemap/locations', function(req, res) {
  var theMap = knex.select('id').from('maps').limit(1)
  .where('user_id', req.params.id);

  knex.select().from('locations').where('map_id', theMap)
  .then(function (locations) {
    res.json(locations);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});


app.post('/maps/new', function(req, res) {
  knex('maps').insert({'user_id': req.session.userId, 'name': req.body.name})
  .then(function(result) {
    res.redirect('/');
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })

});

// instead of longitude/latitude, store the co-ordinates in an array
// Example: [49.28214, -123.07725]  - this is how the API likes the
// data anyway.  OR we can just mutate when we write/read the coords
// Example:  array[0] = long   //   array[1] = lat

// NOT DONE - NEED MAP API REFERENCE
app.post('/maps/:id/locations', function(req, res) {
  console.log("MAP ID", req.params.id);
  console.log(req.session.userId);
  knex('locations')
  .insert({'name': req.body.name, 'summary': req.body.summary, 'latitude': req.body.lat, 'longitude': req.body.long, 'category': req.body.category, 'url': req.body.url, 'img': req.body.image, 'user_id': '3', 'map_id': req.params.id })
  .returning("id")
  .then(function(result) {
    res.redirect('/');
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })

});

// NOT DONE - NEED MAP API REFERENCE
app.post('/maps/:id/locations/copy', function(req, res) {
  knex('locations').insert({'name': req.body.name, 'summary': req.body.summary, 'latitude': req.body.lat, 'longitude': req.body.long, 'category': req.body.category, 'url': req.body.url, 'img': req.body.image, 'user_id': req.session.userId, 'map_id': req.params.id })
  .then(function(result) {
    res.redirect({success: true});
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

app.put('/locations/:id', function(req, res) {
  knex('locations')
  .where('id', req.params.id)
  .update({'name': req.body.name, 'summary': req.body.summary, 'latitude': req.body.lat, 'longitude': req.body.long, 'category': req.body.category, 'url': req.body.url, 'img': req.body.image, 'user_id': req.session.userId })
  .then(function(result) {
    res.redirect('/');
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

app.delete('/locations/:id', function(req, res) {
  console.log("hello")
  knex('locations').where('id', req.params.id).del()
  .then(function(result) {
    res.redirect('/');
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

app.get('/api/users', function(req, res) {
  knex.select().from('users')
  .then(function(users) {
    res.json(users);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});


// New route: get user-favorited maps
app.get('/api/users/:id/favourites', function(req, res) {
  var map_id_set = knex.select('map_id').from('favourite_maps')
  .where('user_id', req.params.id);

  knex('users').distinct('avatar', 'handle', 'name', 'map_id').select()
  .innerJoin('maps', 'users.id', 'user_id')
  .innerJoin('favourite_maps', 'maps.id', 'map_id')
  .whereIn('map_id', map_id_set).orderBy('name', 'desc')
  .then(function(info) {
    res.json(info);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});


// New route: get list of users logged in user is following
app.get('/api/users/:id/following', function(req, res) {
  var followings = knex.select('following_id').from('follow_pairs')
  .where('follower_id', req.params.id);

  knex('users').distinct('avatar', 'handle', 'bio').select()
  .innerJoin('follow_pairs', 'users.id', 'following_id')
  .whereIn('following_id', followings)
  .then(function(info) {
    res.json(info);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});


// New route: load locations for a specific map
app.get('/api/map/:id/locations', function(req, res) {
  knex.select().from('locations').where('map_id', req.params.id)
  .then(function (locations) {
    res.json(locations);
  })
  .catch(function(error) {
    console.error(error);
    res.json({error: {message: error}})
  })
});

// New route: load map by map name
app.get('/api/map/:name', function(req, res) {
  knex.select('id').from('maps').where('maps.name', req.params.name)
  .then(function (mapId) {
    res.send(mapId);
  })
  .catch(function(error) {
    console.error(error);
    res.send({error: {message: error}})
  })
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});