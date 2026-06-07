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

    // Parallelize all database queries for maximum performance
    const [
      totalUsers,
      totalJourneys,
      flaggedJourneys,
      flaggedComments,
      recentLogs,
      cacheOperationsEstimated,
      uploadedImagesCount,
      flaggedJourneysList,
      flaggedCommentsList,
      allJourneysList
    ] = await Promise.all([
      User.countDocuments(),
      Journey.countDocuments({ status: { $ne: 'archived' } }),
      Journey.countDocuments({ status: 'flagged' }),
      Comment.countDocuments({ isFlagged: true }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(50).exec(),
      ActivityLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ avatarUrl: { $regex: /imgbb|ibb|cloudinary/ } }),
      Journey.find({ status: 'flagged' }).exec(),
      Comment.find({ isFlagged: true }).exec(),
      Journey.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 }).limit(150).exec()
    ]);

    // Cost Estimations (Calculated based on average payload sizes)
    const userDocSizeAvg = 1.2; // KB
    const journeyDocSizeAvg = 2.5; // KB
    const commentDocSizeAvg = 0.5; // KB

    const mongoUsedBytes = (totalUsers * userDocSizeAvg + totalJourneys * journeyDocSizeAvg + flaggedComments * commentDocSizeAvg) * 1024;
    const mongoFreeLimit = 512 * 1024 * 1024; // 512MB MongoDB Free Tier
    const mongoUsagePct = (mongoUsedBytes / mongoFreeLimit) * 100;

    const cacheOperationsCount = cacheOperationsEstimated * 3;
    const cacheDailyLimit = 50000; // Local memory cache daily limit simulation
    const cacheUsagePct = (cacheOperationsCount / cacheDailyLimit) * 100;

    // Media Storage (ImgBB Free tier)
    const imageSizeAvg = 1.5; // MB
    const cloudinaryUsedMb = uploadedImagesCount * imageSizeAvg;
    const cloudinaryLimitMb = 25 * 1024; // 25GB
    const cloudinaryUsagePct = (cloudinaryUsedMb / cloudinaryLimitMb) * 100;

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
      allJourneysList,
      recentLogs,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  } catch (error: any) {
    // Do not leak raw error message - log server-side only
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { error: isDev ? error.message : 'Internal Server Error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
