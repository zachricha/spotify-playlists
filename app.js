require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const ejs = require('ejs');
const session = require('cookie-session');
const passport = require('passport');

const { userRoutes } = require('./routes');
const app = express();
const secret = process.env.SECRET_KEY;
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(session({ secret: process.env.SECRET_KEY }));
app.use(passport.initialize());
app.use(passport.session());
app.use(userRoutes);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

app.use((err, req, res, next) => {

  res.render('error', {
    eMessage: err.message,
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
