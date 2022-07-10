import express, { json } from "express";
import cors from "cors";
import ImageKit from "imagekit";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectToServer, getDb } from "./db/conn.js";
import mongoDB from "mongodb";
import e from "express";
const ObjectId = mongoDB.ObjectId;

const app = express();
app.use(cors());
app.use(json({ limit: "50mb", extended: true }));

const port = process.env.PORT || 5001;

function getTourCollection() {
  return getDb().collection(process.env.COLLECTION_TOUR);
}

function getTestimonialCollection() {
  return getDb().collection(process.env.COLLECTION_TESTIMONIALS);
}

function getTermsCollection() {
  return getDb().collection(process.env.COLLECTION_TERMS);
}

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

function uploadOneMedia(file) {
  return new Promise(function (resolve, reject) {
    const fileName = file.split(";")[1].split("=")[1];
    imagekit
      .upload({
        file: file,
        fileName: fileName,
        folder: "universe_holidays",
        useUniqueFileName: true,
      })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
        throw err;
      });
  });
}

function uploadMedia(files, response, callback) {
  if (!files) {
    callback([]);
    return;
  }
  const promiseArr = [];
  files.forEach(async (file) => {
    promiseArr.push(uploadOneMedia(file));
  });
  Promise.all(promiseArr)
    .then((res) => {
      callback(res);
    })
    .catch((err) => {
      response.send({ error: "There is an error while uploading media!" });
      throw err;
    });
}

function deleteMedia(fileIds, response, callback = () => {}) {
  if (!fileIds.length) {
    callback({});
    return;
  }
  imagekit
    .bulkDeleteFiles(fileIds)
    .then((res) => {
      if (!res.successfullyDeletedFileIds.length) {
        response.send({ error: "Can not delete Images!" });
        return;
      }
      callback({});
    })
    .catch((err) => {
      response.send({ error: "Error while deleting media!" });
    });
}

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/getAllMedia", function (req, res) {
  imagekit
    .listFiles({
      path: "universe_holidays",
    })
    .then(function (result) {
      res.send(result);
    })
    .catch((err) => {
      res.send({ error: "Error while getting images" });
      throw err;
    });
});

app.delete("/deleteMedia/:fileId", function (req, response) {
  const fileId = req.params.fileId;
  if (!fileId) {
    response.send({ error: "Invalid file id" });
    return;
  }
  deleteMedia([fileId], response, function (result) {
    response.send(result);
  });
});

app.get("/validateMedia", function (req, res) {
  var result = imagekit.getAuthenticationParameters();
  res.send(result);
});

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
  uploadMedia(req.body.images, response, function (allImages) {
    data["images"] = allImages;
    _db.insertOne(data, function (err, res) {
      if (err) throw err;
      response.statusCode = 200;
      response.json(res);
    });
  });
});

function getDefaultImage() {
  return "data:image/svg+xml;base64,PD94bWwg";
}

app.post("/update", async function (req, response) {
  const _db = getTourCollection();
  const newData = { ...req.body };
  delete newData._id;

  if (getDefaultImage() === newData.images[0]) {
    delete newData["prevImages"];
    delete newData["images"];
    const res = await _db.updateOne(
      { _id: ObjectId(req.body._id) },
      {
        $set: newData,
      }
    );
    response.send(res);
  } else {
    const deleteMediaIds = newData.prevImages
      ? newData.prevImages.map((i) => i.fileId)
      : [];

    delete newData["prevImages"];

    deleteMedia(deleteMediaIds, response, function (r) {
      uploadMedia(req.body.images, response, async function (allImages) {
        newData["images"] = allImages;
        const res = await _db.updateOne(
          { _id: ObjectId(req.body._id) },
          {
            $set: newData,
          }
        );
        response.send(res);
      });
    });
  }
});

app.delete("/delete/:id", async function (req, response) {
  const _db = getTourCollection();
  const id = { _id: ObjectId(req.params.id) };

  await _db
    .findOne(id)
    .then((res) => {
      const images = res.images;
      const deleteIds = images.map((i) => (i.fileId ? i.fileId : ""));
      deleteMedia(deleteIds, response);
    })
    .catch((err) => {
      throw err;
    });

  _db.deleteOne(id, function (err, obj) {
    if (err) throw err;
    response.json(obj);
  });
});

app.post("/testimonials", function (req, response) {
  const _db = getTestimonialCollection();
  const data = req.body;
  _db.insertOne(data, function (err, res) {
    if (err) throw err;
    response.statusCode = 200;
    response.json(res);
  });
});

app.post("/updateterms", async function (req, response) {
  const _db = getTermsCollection();
  const id = ObjectId(req.body._id);
  const res = _db.updateOne(
    { _id: id },
    {
      $set: {
        terms: req.body.terms,
      },
    }
  );

  response.send(res);
});

app.get("/terms", function (req, response) {
  const _db = getTermsCollection();
  _db.find({}).toArray(function (err, res) {
    if (err) throw err;
    response.json(res);
  });
});

app.listen(port, () => {
  connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});
