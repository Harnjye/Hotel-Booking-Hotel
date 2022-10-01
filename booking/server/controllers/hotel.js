import hotel from "../models/hotel";
import fs from "fs";

export const create = async (req, res) => {
  // console.log("req.fields", req.fields);
  // console.log("req.files", req.files);
  try {
    let fields = req.fields;
    let files = req.files;

    let Hotel = new hotel(fields);
    Hotel.postedBy = req.user._id;
    // handle image
    if (files.image) {
      Hotel.image.data = fs.readFileSync(files.image.path);
      Hotel.image.contentType = files.image.type;
    }
    Hotel.save((err, result) => {
      if (err) {
        console.log("saving hotel err =>", err);
        res.status(400).send("Error saving");
      } 
      res.json(result);
    })
  } catch (err) {
    console.log(err);
    res.status(400).json({
      err: err.message,
    });
  }
};

export const hotels = async (req, res) => {
  let all = await hotel.find({})
    .limit(24)
    .select("-image.data")
    .populate("postedBy", "_id name")
    .exec();
  // console.log(all);
  res.json(all);
};

export const image = async (req, res) => {
  let Hotel = await hotel.findById(req.params.hotelId).exec();
  if (Hotel && Hotel.image && Hotel.image.data !== null) {
    // res.set("Content-Type", Hotel.image.contentType)
    res.send(Hotel.image.data);
  };
};

export const sellerHotels = async (req, res) => {
  let all = await hotel.find({ postedBy: req.user._id })
    .select("-image.data")
    .populate("postedBy", "_id name")
    .exec();
  console.log(all);
  res.send(all);
};

export const remove = async (req, res) => {
  let removed = await hotel.findByIdAndDelete(req.params.hotelId)
    .select("-image.data")
    .exec();
  res.json(removed);
};

export const read = async (req, res) => {
  let Hotel = await hotel.findById(req.params.hotelId)
    .populate("postedBy", "_id name")
    .select("-image.data")
    .exec();
  console.log("SINGLE HOTEL", Hotel);
  res.json(Hotel);
};

export const update = async (req, res) => {
  try {
    let fields = req.fields;
    let files = req.files;

    let data = { ...fields };
    
    if (files.image) {
      let image = {}
      image.data = fs.readFileSync(files.image.path);
      image.contentType = "image/jpeg";

      data.image = image;
    }

    let update = await hotel.findByIdAndUpdate(req.params.hotelId, data, {
      new: true,
    })
    //.select(-image.data);
    res.json(update);
  } catch (err) {
    console.log(err);
    res.status(400).send("Hotel update failed. Try again.");
  }
};