const express = require('express');
const { User } = require('../models');
const passport = require('passport');
const spotifyStrategy = require('passport-spotify').Strategy;
const SpotifyWebApp = require('spotify-web-api-node');

const Router = express.Router();
let expiresIn = null;

let spotifyApi = new SpotifyWebApp({
  clientId: process.env.SPOTIFY_APP_ID,
  clientSecret: process.env.SPOTIFY_APP_SECRET,
  callbackURL: process.env.SPOTIFY_APP_CALLBACK,
});

passport.use(new spotifyStrategy({
  clientID: process.env.SPOTIFY_APP_ID,
  clientSecret: process.env.SPOTIFY_APP_SECRET,
  callbackURL: process.env.SPOTIFY_APP_CALLBACK,
},
  function(accessToken, refreshToken, expires_in, profile, done) {
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    expiresIn = expires_in;
    User.findOrCreate({spotify_id: profile.id}, function(err, user) {
      if(err) {
        return done(err)
      };
      done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

function loginRequired(req, res, next) {
  const pastToken = spotifyApi.getAccessToken();
  if(!req.user || !pastToken) {
    return res.redirect('/login');
  };

  spotifyApi.refreshAccessToken().then((data) => {
    const token = data.body['access_token'];
    spotifyApi.setAccessToken(token);

    return next();
  }).catch(e => {
    next(e);
  });
};

Router.route('/auth/spotify').get(passport.authenticate('spotify',
{scope: ['user-read-email', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private'], showDialog: true} ));

Router.route('/auth/spotify/callback').get(passport.authenticate('spotify', {
  successRedirect: '/', failureRedirect: '/login' }));

// login
Router.route('/login').get((req, res, next) => {
  const token = spotifyApi.getAccessToken();

  if(req.user && token) {
    return res.redirect('/');
  };
  res.render('login');
});
// logout
Router.route('/logout').post((req, res, next) => {
  spotifyApi.resetCredentials();
  req.logout();
  res.redirect('/login');
});
// index shows user and playlists
Router.route('/').get(loginRequired, (req, res, next) => {
  spotifyApi.getUserPlaylists(req.user.spotify_id).then((playlists) => {
    res.render('index', { playlists: playlists.body.items, user: req.user });
  }).catch(e => {
    next(e);
  });
});
// search bar
Router.route('/search').post(loginRequired, (req, res, next) => {
    return res.redirect(`/search/${req.body.search}`);
  });
// search for tracks
Router.route('/search/:query').get(loginRequired, (req, res, next) => {
  spotifyApi.searchTracks(req.params.query).then((tracks) => {
    res.render('search', { tracks: tracks.body.tracks.items });
  }).catch(e => {
    next(e);
  });
});
// show playlist
Router.route('/playlist/:id').get(loginRequired, (req, res, next) => {
  spotifyApi.getPlaylist(req.user.spotify_id, req.params.id).then((playlist) => {
    res.render('playlist', { playlist: playlist.body });
  }).catch(e => {
    next(e);
  });
});
// delete track from playlist
Router.route('/playlist/:id/remove/:track').delete(loginRequired, (req, res, next) => {
  spotifyApi.removeTracksFromPlaylist(req.user.spotify_id, req.params.id, [{uri: req.params.track}]).then((track) => {
    res.redirect(`/playlist/${req.params.id}`);
  }).catch(e => {
    next(e);
  });
});
// add track to playlist
Router.route('/playlist/:id/add/:track').patch(loginRequired, (req, res, next) => {
  spotifyApi.addTracksToPlaylist(req.user.spotify_id, req.params.id, [req.params.track]).then((track) => {
    res.redirect('/');
  }).catch(e => {
    next(e);
  });
});
// select what playlist to add track
Router.route('/playlist/select/:track/name/:name').get(loginRequired, (req, res, next) => {
  spotifyApi.getUserPlaylists(req.user.spotify_id).then((playlists) => {
    res.render('add', { playlists: playlists.body.items, track: req.params.track, name: req.params.name, user: req.user });
  }).catch(e => {
    next(e);
  });
});

module.exports = Router;
