const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://swayamgupta999_db_user:TNDyq70hAUopV2LX@not-yet.klepbqp.mongodb.net/";

const ActivityLogSchema = new mongoose.Schema({
  userId: String,
  username: String,
  action: String,
  details: String,
  severity: String,
  createdAt: Date,
});

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(20);
    console.log("ACTIVITY LOGS:", JSON.stringify(logs, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
