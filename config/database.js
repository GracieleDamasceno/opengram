const mongoose = require('mongoose');

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
  } = process.env;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
mongoose.connect(url, options)
  .then(() => {
    console.log('[LOG] - Connection with MongoDB was established');
  }).catch((err) => {
    console.log(err);
  });
// mongodb://127.0.0.1:27017