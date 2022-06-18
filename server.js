import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import { connectToServer, getDb } from "./db/conn.js";

const app = express();
app.use(cors());
app.use(json());

const port = process.env.PORT || 5001;

app.get("/view", function (req, res) {
  const _db = getDb();
  _db.find({}).toArray(function (err, result) {
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

app.listen(port, () => {
  // perform a database connection when server starts
  connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});
