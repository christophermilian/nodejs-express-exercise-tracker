# nodejs-express-exercise-tracker

## Description

A Nodejs full stack application that tracks exercise behavior.

## Available Endpoints

1. **GET**: `/api/users`
2. **GET**: `/api/users/:_id/logs`
3. **POST**: `/api/users`
4. **POST**: `/api/users/:_id/exercises`

## Examples
- `http:localhost:<port>/api/users`
  ```
  [
      {
          "_id": "6567eb0c01415096fb41f9df",
          "username": "chrismilian26",
          "__v": 0
      },
      {
          "_id": "6567f3578b333fa8e92bfbdf",
          "username": "apple50",
          "__v": 0
      },
  ]
  ```
- `http:localhost:<port>/api/users/6567eb0c01415096fb41f9df/logs?from=2023-10-01&to=2023-10-29&limit=10`
  - `from` are `to` are optional dates of format yyyy-mm-dd
  - `limit` is optional number
  ```
  {
    "username": "chrismilian26",
    "count": 2,
    "_id": "6567eb0c01415096fb41f9df",
    "log": [
        {
            "description": "test",
            "duration": 60,
            "date": "Wed Nov 29 2023"
        },
        {
            "description": "waves",
            "duration": 40,
            "date": "Fri Nov 10 2023"
        },
    ]
  }
  ```
- `http:localhost:<port>/api/users`
  ```
  {
    "username": "chrismilian26"
  }
  ```
- `http:localhost:<port>/api/users/6567eb0c01415096fb41f9df/exercises`
  ```
   {
    "description": "Bike around",
    "duration": "30",
    "date": "2023-10-13"
   }
  ```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start
```

## License
[MIT licensed](LICENSE)
