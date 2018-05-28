const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');

const userSchema = new mongoose.Schema({
  spotify_id: String,
});

userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);
module.exports = User;
