const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(formidable());
app.use(cors());
require("dotenv").config();
// mongoose.connect("mongodb://localhost/vinted");
mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("*", () => {
    res.status(404).json("Page not found");
});

app.listen(3000, () => {
    console.log("Server Started !");
});
