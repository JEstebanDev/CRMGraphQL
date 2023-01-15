const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

connectDB().catch((err) => console.error("Error " + err));

async function connectDB() {
  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.DV_MONGO);
  console.log("DB Connected...");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

module.exports = connectDB;
