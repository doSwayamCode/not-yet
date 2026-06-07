import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Reaction } from '@/models/Reaction';
import { Journey } from '@/models/Journey';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { getServerAuth } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED_REACTIONS = ['relatable', 'beenThere', 'learnedSomething', 'inspiredMe', 'neededThis', 'respect'];

// POST /api/journeys/[id]/react
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const session = await getServerAuth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting reactions - 100 per hour
    const limiter = await rateLimit(`react_journey:${session.userId}`, 100, 3600);
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many reactions. Slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { type } = body;

    if (!type || !ALLOWED_REACTIONS.includes(type)) {
      return NextResponse.json({ error: `Invalid reaction type. Must be one of: ${ALLOWED_REACTIONS.join(', ')}` }, { status: 400 });
    }

    const journey = await Journey.findById(id);
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Check if reaction already exists (toggle behavior)
    const existing = await Reaction.findOne({ journeyId: id, userId: session.userId, type });

    const authorUser = await User.findOne({ clerkId: journey.userId });
    let reactorUser = await User.findOne({ clerkId: session.userId });
    if (!reactorUser && session.email) {
      reactorUser = await User.findOneAndUpdate(
        { email: session.email },
        { $set: { clerkId: session.userId } },
        { new: true }
      );
    }

    if (!reactorUser) {
      reactorUser = await User.create({
        clerkId: session.userId,
        email: session.email || '',
        username: session.username || `user_${Math.random().toString(36).substring(7)}`,
        displayName: session.displayName || 'Anonymous Persistence',
        avatarUrl: session.avatarUrl || '',
        role: session.role || 'user',
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

      await ActivityLog.create({
        userId: session.userId,
        username: reactorUser.username,
        action: 'USER_REGISTER',
        details: `Registered user: ${reactorUser.username} during reaction toggle`,
        severity: 'info',
      });
    }

    if (existing) {
      // Toggle off: Delete reaction
      await Reaction.deleteOne({ _id: existing._id });

      // Decrement counter on Journey
      const decrKey = `reactions.${type}`;
      await Journey.findByIdAndUpdate(id, { $inc: { [decrKey]: -1 } });

      // Deduct points
      if (authorUser && authorUser.clerkId !== session.userId) {
        await User.findByIdAndUpdate(authorUser._id, { $inc: { persistenceScore: -5 } });
      }
      if (reactorUser) {
        await User.findByIdAndUpdate(reactorUser._id, { $inc: { persistenceScore: -1 } });
      }

      return NextResponse.json({ success: true, action: 'removed', type });
    } else {
      // Toggle on: Create reaction
      await Reaction.create({
        journeyId: id,
        userId: session.userId,
        type,
      });

      // Increment counter on Journey
      const incrKey = `reactions.${type}`;
      await Journey.findByIdAndUpdate(id, { $inc: { [incrKey]: 1 } });

      // Reward points: +1 point to reactor, +5 points to author (if they are different users)
      if (authorUser && authorUser.clerkId !== session.userId) {
        await User.findByIdAndUpdate(authorUser._id, {
          $inc: {
            persistenceScore: 5,
            'stats.peopleHelped': 1,
          },
        });
      }
      if (reactorUser) {
        await User.findByIdAndUpdate(reactorUser._id, {
          $inc: {
            persistenceScore: 1,
          },
        });
      }

      await ActivityLog.create({
        userId: session.userId,
        username: reactorUser?.username || 'unknown',
        action: 'JOURNEY_REACT',
        details: `Reacted "${type}" to journey ID: ${id}`,
        severity: 'info',
      });

      return NextResponse.json({ success: true, action: 'added', type });
    }
  } catch (error: any) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
