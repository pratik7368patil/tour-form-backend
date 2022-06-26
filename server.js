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

function getTourCollection() {
  return getDb().collection(process.env.COLLECTION_TOUR);
}

function getTestimonialCollection() {
  return getDb().collection(process.env.COLLECTION_TESTIMONIALS);
}

app.get("/", function (req, res) {
  res.send("API's are Online!");
});

app.get("/view", function (req, res) {
  const _db = getTourCollection();
  _db.find({}).toArray(function (err, result) {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/view/:id", function (req, res) {
  const _db = getTourCollection();
  const id = { _id: ObjectId(req.params.id) };
  _db.findOne(id, function (err, result) {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/search", function (req, res) {
  const _db = getTourCollection();
  _db.find({}).toArray(function (err, result) {
    if (err) throw err;
    const newResult = result.map((tour) => {
      return { _id: tour._id, name: tour.name };
    });
    res.json(newResult);
  });
});

app.get("/filter/indian", function (req, res) {
  const _db = getTourCollection();
  _db.find({}).toArray(function (err, result) {
    if (err) throw err;
    const newResult = result.filter((tour) => {
      if (tour.country.toLowerCase().trim() === "india") {
        return true;
      }
      return false;
    });
    res.json(newResult);
  });
});

app.get("/filter/international", function (req, res) {
  const _db = getTourCollection();
  _db.find({}).toArray(function (err, result) {
    if (err) throw err;
    const newResult = result.filter((tour) => {
      if (tour.country.toLowerCase().trim() !== "india") {
        return true;
      }
      return false;
    });
    res.json(newResult);
  });
});

app.post("/insert", function (req, response) {
  const _db = getTourCollection();
  const data = req.body;
  _db.insertOne(data, function (err, res) {
    if (err) throw err;
    response.statusCode = 200;
    response.json(res);
  });
});

app.post("/update", async function (req, response) {
  const _db = getTourCollection();
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
  const _db = getTourCollection();
  const id = { _id: ObjectId(req.params.id) };

  _db.deleteOne(id, function (err, obj) {
    if (err) throw err;
    response.json(obj);
  });
});

app.post("/testimonials", function (req, res) {
  const _db = getTestimonialCollection();
  const data = req.body;
  _db.insertOne(data, function (err, res) {
    if (err) throw err;
    response.statusCode = 200;
    response.json(res);
  });
});

app.listen(port, () => {
  connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});
