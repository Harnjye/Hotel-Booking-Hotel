import expressJwt from "express-jwt";
import hotel from "../models/hotel";
// req.user
export const requireSignin = expressJwt({
  // secret, exporyDate
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

export const hotelOwner = async (req, res, next) => {
  let Hotel = await hotel.findById(req.params.hotelId).exec()
  let owner = Hotel.postedBy._id.toString() === req.user._id.toString();
  if (!owner) {
    return res.status(403).send("Unauthorized");
  }
  next();
};