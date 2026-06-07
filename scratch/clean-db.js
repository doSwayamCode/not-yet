const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://swayamgupta999_db_user:TNDyq70hAUopV2LX@not-yet.klepbqp.mongodb.net/";

const UserSchema = new mongoose.Schema({ clerkId: String });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const JourneySchema = new mongoose.Schema({ title: String });
const Journey = mongoose.models.Journey || mongoose.model('Journey', JourneySchema);

const CounterMetricsSchema = new mongoose.Schema({ key: String });
const CounterMetrics = mongoose.models.CounterMetrics || mongoose.model('CounterMetrics', CounterMetricsSchema);

const ActivityLogSchema = new mongoose.Schema({ action: String });
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("CONNECTED TO CLEAN DB");
    await User.deleteMany({ email: /test\.com$/ });
    await Journey.deleteMany({ title: 'My Journey Title Test' });
    await CounterMetrics.deleteMany({ key: 'global_counter' }); // we will reset global counters
    await ActivityLog.deleteMany({ details: 'Created test journey' });
    console.log("CLEANED!");
    process.exit(0);
  });
