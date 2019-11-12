const MongoClient = require("mongodb").MongoClient;

const mongoUrl = process.env.MONGODB_URL;
let _db;

const initDb = callback => {
  if (_db) {
    console.log("Database already initialized.");
    callback(null, _db);
  }

  MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
      _db = client;
      callback(null, _db);
    })
    .catch(err => {
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error("Database not initialized.");
  }

  return _db;
};

module.exports = {
  initDb,
  getDb
};
