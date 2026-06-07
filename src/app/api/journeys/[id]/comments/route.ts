import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { Journey } from '@/models/Journey';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { getServerAuth } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/journeys/[id]/comments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const comments = await Comment.find({ journeyId: id, isFlagged: false })
      .sort({ createdAt: 1 })
      .exec();

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/journeys/[id]/comments
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

    // Rate limiting comments - 20 per hour
    const limiter = await rateLimit(`post_comment:${session.userId}`, 20, 3600);
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many comments. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { content, parentId, visibility, nickname } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const journey = await Journey.findById(id);
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    let user = await User.findOne({ clerkId: session.userId });
    if (!user) {
      // Automatically register user in DB if they don't exist yet
      user = await User.create({
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
        username: user.username,
        action: 'USER_REGISTER',
        details: `Registered user: ${user.username} during comment submission`,
        severity: 'info',
      });
    }

    const authorMetadata = {
      displayName: visibility === 'anonymous'
        ? 'Anonymous Perseverer'
        : visibility === 'nickname' && nickname
        ? nickname
        : user.displayName || user.username,
      username: visibility === 'public' ? user.username : 'anonymous',
      avatarUrl: visibility === 'public'
        ? user.avatarUrl || ''
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      isAnonymous: visibility !== 'public',
      nickname: visibility === 'nickname' ? nickname : undefined,
    };

    const newComment = await Comment.create({
      journeyId: id,
      userId: session.userId,
      author: authorMetadata,
      content: content.trim(),
      parentId: parentId || null,
      isPinned: false,
      isFlagged: false,
    });

    // Update comment count on Journey
    await Journey.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

    // Reward points for engagement: +2 persistence score points
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        persistenceScore: 2,
        'stats.peopleHelped': 1,
      },
    });

    await ActivityLog.create({
      userId: session.userId,
      username: user.username,
      action: 'COMMENT_CREATE',
      details: `Commented on journey ID: ${id}. Earned 2 points.`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
