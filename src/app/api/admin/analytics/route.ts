import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Journey } from '@/models/Journey';
import { Comment } from '@/models/Comment';
import { ActivityLog } from '@/models/ActivityLog';
import { requireAdmin } from '@/lib/auth-server';

// GET /api/admin/analytics
export async function GET() {
  try {
    await connectToDatabase();
    
    // Auth guard - Admin only
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    // System Stats
    const totalUsers = await User.countDocuments();
    const totalJourneys = await Journey.countDocuments({ status: { $ne: 'archived' } });
    const flaggedJourneys = await Journey.countDocuments({ status: 'flagged' });
    const flaggedComments = await Comment.countDocuments({ isFlagged: true });
    
    // Fetch recent logs
    const recentLogs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Cost Estimations (Calculated based on average payload sizes)
    const userDocSizeAvg = 1.2; // KB
    const journeyDocSizeAvg = 2.5; // KB
    const commentDocSizeAvg = 0.5; // KB

    const mongoUsedBytes = (totalUsers * userDocSizeAvg + totalJourneys * journeyDocSizeAvg + flaggedComments * commentDocSizeAvg) * 1024;
    const mongoFreeLimit = 512 * 1024 * 1024; // 512MB MongoDB Free Tier
    const mongoUsagePct = (mongoUsedBytes / mongoFreeLimit) * 100;

    // Memory Cache operations count (simulated or tracked)
    const cacheOperationsEstimated = await ActivityLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) * 3;
    const cacheDailyLimit = 50000; // Local memory cache daily limit simulation
    const cacheUsagePct = (cacheOperationsEstimated / cacheDailyLimit) * 100;

    // Media Storage (ImgBB Free tier)
    const uploadedImagesCount = await User.countDocuments({ avatarUrl: { $regex: /imgbb|ibb|cloudinary/ } });
    const imageSizeAvg = 1.5; // MB
    const cloudinaryUsedMb = uploadedImagesCount * imageSizeAvg;
    const cloudinaryLimitMb = 25 * 1024; // 25GB
    const cloudinaryUsagePct = (cloudinaryUsedMb / cloudinaryLimitMb) * 100;

    // Fetch flagged content for moderation queues
    const flaggedJourneysList = await Journey.find({ status: 'flagged' }).exec();
    const flaggedCommentsList = await Comment.find({ isFlagged: true }).exec();

    const costDashboard = {
      mongodb: {
        usedKb: (mongoUsedBytes / 1024).toFixed(2),
        limitKb: (mongoFreeLimit / 1024).toFixed(2),
        percentage: mongoUsagePct.toFixed(4),
        cost: 0.00,
      },
      redis: {
        commandsToday: cacheOperationsEstimated,
        limitDaily: cacheDailyLimit,
        percentage: Math.min(100, cacheUsagePct).toFixed(2),
        cost: 0.00,
      },
      cloudinary: {
        usedMb: cloudinaryUsedMb.toFixed(2),
        limitMb: cloudinaryLimitMb.toFixed(2),
        percentage: cloudinaryUsagePct.toFixed(4),
        cost: 0.00,
      },
      resend: {
        sentThisMonth: 0,
        limitMonthly: 0,
        percentage: '0.00',
        cost: 0.00,
      },
      estimatedMonthlyBill: 0.00,
      currency: 'INR',
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalJourneys,
        flaggedJourneys,
        flaggedComments,
      },
      costDashboard,
      flaggedJourneysList,
      flaggedCommentsList,
      recentLogs,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
