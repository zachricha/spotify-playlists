const mongoose = require('mongoose');

mongoose.Promise = Promise;

mongoose.connect(process.env.MONGODB_URI ||'mongodb://localhost:27017/users').then(() => {
  console.log('mongodb is connected');
}).catch(e => {
  console.log(e);
});

exports.User = require('./users');
