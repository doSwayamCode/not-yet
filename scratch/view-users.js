const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://swayamgupta999_db_user:TNDyq70hAUopV2LX@not-yet.klepbqp.mongodb.net/";

const UserSchema = new mongoose.Schema({
  clerkId: String,
  email: String,
  username: String,
  displayName: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const users = await User.find({});
    console.log("USERS IN DB:", JSON.stringify(users, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
