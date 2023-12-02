const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
});

const UserModel = mongoose.model('ExerciseUsers', userSchema);

exports.UserModel = UserModel;