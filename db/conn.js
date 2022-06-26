import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.ATLAS_URI;
let _db;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

export const connectToServer = function (callback) {
  client.connect(function (err, db) {
    // Verify we got a good "db" object
    if (db) {
      _db = client.db(process.env.DB_NAME);
      console.log("Successfully connected to MongoDB.");
    }
    return callback(err);
  });
};

export const getDb = function () {
  return _db;
};
