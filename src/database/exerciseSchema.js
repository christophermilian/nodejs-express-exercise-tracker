const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    min: 1,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
});

const ExercisesModel = mongoose.model('Exercises', exerciseSchema);

exports.ExercisesModel = ExercisesModel;