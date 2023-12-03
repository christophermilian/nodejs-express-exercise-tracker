const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// server configurations

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/src/public'));

// mongoose models
const exerciseSchema = new mongoose.Schema({
  userId: {
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
    default: Date.now,
  },
});
const ExercisesModel = mongoose.model('Exercises', exerciseSchema);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
});
const UserModel = mongoose.model('Users', userSchema);

// middleware

/**
 * Middleware function to log request information
 */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} -${req.ip}`);
  next();
});

// routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const inputUsername = req.body.username;
  if (!inputUsername || inputUsername?.length == 0) {
    throw Error('A username is required.');
  }

  UserModel.findOne({ username: inputUsername }, (error) => {
    if (error) {
      return res.json({ message: 'The given username already exists' });
    }

    const newUser = new UserModel({
      username: inputUsername,
    });

    newUser.save((error, data) => {
      if (error) {
        return res.json({ message: error });
      }
      return res.json({
        _id: data['_id'],
        username: inputUsername,
      });
    });
  });
});

app.get('/api/users', (req, res) => {
  UserModel.find({}, (error, data) => {
    if (error) {
      return res.json({ message: error });
    } else {
      return res.json(data);
    }
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const input = {
    userId: req.params._id,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date !== undefined ? new Date(req.body.date) : new Date(),
  };

  if (isNaN(input.duration)) {
    return res.json({ error: 'The duration input is not a number' });
  }

  if (input.date.toString() == 'Invalid Date') {
    return res.json({ message: 'The date input is invalid' });
  }

  UserModel.findById(input.userId, (error, data) => {
    if (error) {
      return res.json({ error: 'user not found' });
    }
    const newExercise = new ExercisesModel(input);

    newExercise.save((saveError, data2) => {
      if (saveError) {
        return res.json({ message: saveError });
      }
      return res.json({
        _id: data['_id'],
        username: data['username'],
        description: data2['description'],
        duration: data2['duration'],
        date: new Date(data2['date']).toDateString(),
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;

  if (isNaN(limit)) {
    return res.json({ message: 'The input limit is not a number' });
  }

  const userId = req.params._id;
  const findConditions = { userId: userId };

  if (
    (req.query.from !== undefined && req.query.from?.length !== 0) ||
    (req.query.to !== undefined && req.query.to?.length !== 0)
  ) {
    findConditions.date = {};

    findConditions.date.$gte = req.query.from
      ? new Date(req.query.from)
      : new Date('1970-01-01');
    // An invalid Date object will give 'Invalid Date' upon the toString() method
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#return_value
    if (findConditions.date.$gte.toString() == 'Invalid Date') {
      return res.json({ message: 'The from input date is invalid' });
    }
    findConditions.date.$lte = req.query.to
      ? new Date(req.query.to)
      : new Date();
    // An invalid Date object will give 'Invalid Date' upon the toString() method
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#return_value
    if (findConditions.date.$lte.toString() == 'Invalid Date') {
      return res.json({ message: 'to date is invalid' });
    }
  }

  UserModel.findById(userId, (findByIdError, findByIdData) => {
    if (findByIdError) {
      return res.json({ findByIdError: 'The given user was not found' });
    }
    ExercisesModel.find(findConditions)
      .sort({ date: 'asc' })
      .limit(limit)
      .exec((findError, exerciseData) => {
        if (findError) {
          return res.json({ message: findError });
        }
        return res.json({
          _id: findByIdData['_id'],
          username: findByIdData['username'],
          count: exerciseData.length,
          log: exerciseData.map((exercise) => {
            return {
              description: exercise.description,
              duration: exercise.duration,
              date: new Date(exercise.date).toDateString(),
            };
          }),
        });
      });
  });
});

// run server listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + listener.address().port);
});
