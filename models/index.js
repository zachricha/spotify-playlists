const mongoose = require('mongoose');

mongoose.set('debug', true);
mongoose.Promise = Promise;

mongoose.connect('mongodb://localhost:27017/users', {}).then(() => {
  console.log('mongodb is connected');
}).catch(e => {
  console.log(e);
});

exports.User = require('./users');
