
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config()

// server configurations

mongoose.connect(
    process.env.MONGO_URI, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true
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
      default: Date.now
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
	if (!inputUsername || inputUsername.length == 0) {
		throw Error("A username is required.");
	}


	UserModel.findOne({ username: inputUsername }, (error, data) => {
		if (error) {
            return res.json({ error: 'username already exists' });
		} 
        
        const newUser = new UserModel({
            username: inputUsername
        });

        newUser.save((error, data) => {
            if (error) {
                return res.json({ message: error })
            }
            return res.json({
                _id: data['_id'],
                username: inputUsername
            });
        });
	});
});

app.get('/api/users', (req, res) => {
	UserModel.find({}, (error, data) => {
		if (error) {
            return res.json({ message: error });
		}else{
            return res.json(data);
        }
	});
});

app.post('/api/users/:_id/exercises', (req, res) => {
    const input = {
        userId: req.params._id,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: req.body.date !== undefined ? new Date(req.body.date) : new Date()
    }

	if (isNaN(input.duration)) {
		return res.json({ error: 'duration is not a number' });
	}

	if (input.date == 'Invalid Date') {
		return res.json({ error: 'date is invalid' });
	}

	UserModel.findById(input.userId, (error, data) => {
		if (!error && data !== null) {
			const newExercise = new ExercisesModel(input);

			newExercise.save((err2, data2) => {
				if (!err2) {
					return res.json({
						_id: data['_id'],
						username: data['username'],
						description: data2['description'],
						duration: data2['duration'],
						date: new Date(data2['date']).toDateString()
					});
				}
                else{
                    return res.json({ message: err2 })
                }
			});
		} else {
			return res.json({ error: 'user not found' });
		}
	});
});

app.get('/api/users/:_id/logs', (req, res) => {
	const userId = req.params._id;
	let findConditions = { userId: userId };

	if (
		(req.query.from !== undefined && req.query.from !== '')
		||
		(req.query.to !== undefined && req.query.to !== '')
	) {
		findConditions.date = {};

		if (req.query.from !== undefined && req.query.from !== '') {
			findConditions.date.$gte = new Date(req.query.from);
		}

		if (findConditions.date.$gte == 'Invalid Date') {
			return res.json({ error: 'from date is invalid' });
		}

		if (req.query.to !== undefined && req.query.to !== '') {
			findConditions.date.$lte = new Date(req.query.to);
		}

		if (findConditions.date.$lte == 'Invalid Date') {
			return res.json({ error: 'to date is invalid' });
		}
	}

	const limit = (req.query.limit !== undefined ? parseInt(req.query.limit) : 0);

	if (isNaN(limit)) {
		return res.json({ error: 'limit is not a number' });
	}

	UserModel.findById(userId, (error, data) => {
		if (!error && data !== null) {
			ExercisesModel.find(findConditions).sort({ date: 'asc' }).limit(limit).exec((err2, data2) => {
				if (!err2) {
					return res.json({
						_id: data['_id'],
						username: data['username'],
						log: data2.map((e) => {
							return {
								description: e.description,
								duration: e.duration,
								date: new Date(e.date).toDateString()
							};
						}),
						count: data2.length
					});
				}else{
                    return res.json({ message: err2 })
                }
			});
		} else {
			return res.json({ error: 'user not found' });
		}
	});
});

// run server listener
const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('App is listening on port ' + listener.address().port);
});
