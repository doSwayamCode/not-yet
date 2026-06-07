const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://swayamgupta999_db_user:TNDyq70hAUopV2LX@not-yet.klepbqp.mongodb.net/";

console.log("Connecting to:", MONGODB_URI);

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESSFULLY CONNECTED TO MONGODB ATLAS");
    process.exit(0);
  })
  .catch((err) => {
    console.error("CONNECTION FAILED:", err.message);
    process.exit(1);
  });
