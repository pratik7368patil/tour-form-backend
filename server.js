import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectToServer, getDb } from "./db/conn.js";
import mongoDB from "mongodb";
const ObjectId = mongoDB.ObjectId;

const app = express();
app.use(cors());
app.use(json());

const port = process.env.PORT || 5001;

app.get("/", function (req, res) {
  res.send("API's are Online!");
});

app.get("/view", function (req, res) {
  const _db = getDb();
  _db.find({}).toArray(function (err, result) {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/view/:id", function (req, res) {
  const _db = getDb();
  const id = { _id: ObjectId(req.params.id) };
  _db.findOne(id, function (err, result) {
    if (err) throw err;
    res.json(result);
  });
});

app.post("/insert", function (req, response) {
  const _db = getDb();
  const data = req.body;
  _db.insertOne(data, function (err, res) {
    if (err) throw err;
    response.statusCode = 200;
    response.json(res);
  });
});

app.post("/update", async function (req, response) {
  const _db = getDb();
  const newData = { ...req.body };
  delete newData._id;
  const res = await _db.updateOne(
    { _id: ObjectId(req.body._id) },
    {
      $set: newData,
    }
  );
  response.send(res);
});

app.delete("/delete/:id", function (req, response) {
  const _db = getDb();
  const id = { _id: ObjectId(req.params.id) };

  _db.deleteOne(id, function (err, obj) {
    if (err) throw err;
    response.json(obj);
  });
});

app.listen(port, () => {
  // perform a database connection when server starts
  connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});
