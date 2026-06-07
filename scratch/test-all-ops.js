const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://swayamgupta999_db_user:TNDyq70hAUopV2LX@not-yet.klepbqp.mongodb.net/";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  displayName: String,
  avatarUrl: String,
  role: { type: String, default: 'user' },
  persistenceScore: { type: Number, default: 0 },
  stats: {
    attemptsCount: { type: Number, default: 0 },
    rejectionsCount: { type: Number, default: 0 },
    lessonsCount: { type: Number, default: 0 },
    peopleHelped: { type: Number, default: 0 },
    storiesPublished: { type: Number, default: 0 },
  },
  achievements: [String],
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const TimelineEventSchema = new mongoose.Schema({
  date: String,
  title: String,
  description: String,
  status: String,
});

const JourneySchema = new mongoose.Schema({
  userId: String,
  author: {
    displayName: String,
    username: String,
    avatarUrl: String,
    isAnonymous: Boolean,
  },
  title: String,
  goal: String,
  category: String,
  tags: [String],
  timeline: [TimelineEventSchema],
  whatHappened: String,
  lowestPoint: String,
  biggestMistake: String,
  whatChanged: String,
  whatLearned: String,
  advice: String,
  currentStatus: String,
  reflection: String,
  readingTime: Number,
  visibility: String,
  isPublished: Boolean,
  status: String,
});

const Journey = mongoose.models.Journey || mongoose.model('Journey', JourneySchema);

const CounterMetricsSchema = new mongoose.Schema({
  key: String,
  applicationsRejected: Number,
  interviewsFailed: Number,
  hackathonsLost: Number,
  startupsClosed: Number,
  projectsAbandoned: Number,
  lessonsShared: Number,
  peopleHelped: Number,
  storiesPublished: Number,
});

const CounterMetrics = mongoose.models.CounterMetrics || mongoose.model('CounterMetrics', CounterMetricsSchema);

const ActivityLogSchema = new mongoose.Schema({
  userId: String,
  username: String,
  action: String,
  details: String,
  severity: String,
});

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("CONNECTED");
    const userId = "test_user_" + Math.random().toString(36).substring(7);
    
    console.log("Creating user...");
    const user = await User.create({
      clerkId: userId,
      email: `${userId}@test.com`,
      username: userId,
      displayName: 'Test User',
      avatarUrl: '',
      role: 'user',
      persistenceScore: 10,
      stats: {
        attemptsCount: 0,
        rejectionsCount: 0,
        lessonsCount: 0,
        peopleHelped: 0,
        storiesPublished: 0,
      },
      achievements: ['First Step'],
    });
    console.log("User created:", user._id);

    console.log("Creating journey...");
    const journey = await Journey.create({
      userId: userId,
      author: {
        displayName: 'Test User',
        username: userId,
        avatarUrl: '',
        isAnonymous: false,
      },
      title: 'My Journey Title Test',
      goal: 'My Goal Test',
      category: 'Careers & Placement',
      tags: [],
      timeline: [{ date: 'Jan 2026', title: 'Fail', description: 'Failed interview', status: 'fail' }],
      whatHappened: 'I applied to a bunch of tech companies but got rejected. I practiced Leetcode every day and eventually improved my interviewing skills.',
      lowestPoint: 'Burnout',
      biggestMistake: 'None',
      whatChanged: 'Everything',
      whatLearned: 'Nothing',
      advice: 'None',
      currentStatus: 'Applying',
      reflection: 'Peaceful',
      readingTime: 1,
      visibility: 'public',
      isPublished: true,
      status: 'active',
    });
    console.log("Journey created:", journey._id);

    console.log("Updating user score...");
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        persistenceScore: 60,
        'stats.storiesPublished': 1,
        'stats.attemptsCount': 1,
        'stats.rejectionsCount': 1,
        'stats.lessonsCount': 1,
      },
    });
    console.log("User updated");

    console.log("Updating global counters...");
    await CounterMetrics.findOneAndUpdate(
      { key: 'global_counter' },
      {
        $inc: {
          applicationsRejected: 1,
          interviewsFailed: 0,
          hackathonsLost: 0,
          startupsClosed: 0,
          projectsAbandoned: 0,
          lessonsShared: 1,
          peopleHelped: 5,
          storiesPublished: 1,
        },
      },
      { upsert: true, new: true }
    );
    console.log("Counters updated");

    console.log("Creating activity log...");
    await ActivityLog.create({
      userId: userId,
      username: userId,
      action: 'JOURNEY_CREATE',
      details: 'Created test journey',
      severity: 'info',
    });
    console.log("Activity log created");

    console.log("ALL DB OPERATIONS SUCCEEDED!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("OPERATION FAILED:", err);
    process.exit(1);
  });
