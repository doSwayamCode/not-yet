import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { getServerAuth } from '@/lib/auth-server';
import { ActivityLog } from '@/models/ActivityLog';

export async function POST() {
  try {
    await connectToDatabase();
    const session = await getServerAuth();

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await User.findOne({ clerkId: session.userId });

    if (!user && session.email) {
      user = await User.findOneAndUpdate(
        { email: session.email },
        { $set: { clerkId: session.userId } },
        { new: true }
      );
    }

    if (!user) {
      // Create new user in the DB
      user = await User.create({
        clerkId: session.userId,
        email: session.email || '',
        username: session.username || `user_${Math.random().toString(36).substring(7)}`,
        displayName: session.displayName || 'Anonymous Persistence',
        avatarUrl: session.avatarUrl || '',
        role: session.role || 'user',
        persistenceScore: 10, // starting gift
        stats: {
          attemptsCount: 0,
          rejectionsCount: 0,
          lessonsCount: 0,
          peopleHelped: 0,
          storiesPublished: 0,
        },
        achievements: ['First Step'],
      });

      await ActivityLog.create({
        userId: session.userId,
        username: user.username,
        action: 'USER_REGISTER',
        details: `Registered new user: ${user.username}`,
        severity: 'info',
      });
    } else {
      // Update existing user display name/avatar if changed
      let changed = false;
      const updates: any = {};
      
      if (session.displayName && user.displayName !== session.displayName) {
        updates.displayName = session.displayName;
        changed = true;
      }
      if (session.avatarUrl && user.avatarUrl !== session.avatarUrl) {
        updates.avatarUrl = session.avatarUrl;
        changed = true;
      }
      // Sync Clerk role changes to DB if available
      if (session.role && user.role !== session.role) {
        updates.role = session.role;
        changed = true;
      }

      if (changed) {
        user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error syncing auth user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
