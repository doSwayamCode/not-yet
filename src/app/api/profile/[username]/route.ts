import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Journey } from '@/models/Journey';

// GET /api/profile/[username]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectToDatabase();
    const { username } = await params;

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch public journeys of this user
    const journeys = await Journey.find({
      userId: user.clerkId,
      status: 'active',
      isPublished: true,
      visibility: { $in: ['public', 'nickname'] },
    }).sort({ createdAt: -1 });

    // Generate GitHub-style Failure Heatmap
    // We look at all journeys by this user and collect all 'fail' status timeline events.
    const allJourneysForHeatmap = await Journey.find({
      userId: user.clerkId,
      status: 'active',
    });

    const heatmap: Record<string, number> = {};

    for (const journey of allJourneysForHeatmap) {
      if (!journey.timeline) continue;
      for (const event of journey.timeline) {
        if (event.status === 'fail') {
          // Normalize date format YYYY-MM-DD
          let dateStr = event.date;
          try {
            const dateObj = new Date(event.date);
            if (!isNaN(dateObj.getTime())) {
              dateStr = dateObj.toISOString().split('T')[0];
            }
          } catch {
            // keep original string if parsing fails
          }
          heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        persistenceScore: user.persistenceScore,
        stats: user.stats,
        achievements: user.achievements,
        createdAt: user.createdAt,
      },
      journeys,
      heatmap,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
