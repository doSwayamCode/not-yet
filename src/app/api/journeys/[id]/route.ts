import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Journey } from '@/models/Journey';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { getServerAuth } from '@/lib/auth-server';

// GET /api/journeys/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const journey = await Journey.findById(id);

    if (!journey || journey.status === 'archived') {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    if (!journey.isPublished) {
      const session = await getServerAuth();
      const canViewPending = session.userId === journey.userId || session.role === 'admin';

      if (!canViewPending) {
        return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, journey });
  } catch (error: any) {
    console.error('Error fetching journey:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/journeys/[id]
export async function PUT(
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

    const journey = await Journey.findById(id);
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Check ownership or admin permissions
    const isOwner = journey.userId === session.userId;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not own this journey.' }, { status: 403 });
    }

    const body = await req.json();

    // Fields allowed to update
    const allowedUpdates = [
      'title',
      'goal',
      'category',
      'tags',
      'timeline',
      'whatHappened',
      'lowestPoint',
      'biggestMistake',
      'whatChanged',
      'whatLearned',
      'advice',
      'currentStatus',
      'reflection',
      'visibility',
      'nickname',
    ];

    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Re-calculate reading time if body changes text fields
    const textFields = ['whatHappened', 'lowestPoint', 'biggestMistake', 'whatChanged', 'whatLearned', 'advice', 'reflection'];
    const hasTextChanged = textFields.some((f) => body[f] !== undefined);

    if (hasTextChanged) {
      const combinedText = textFields
        .map((f) => body[f] ?? journey[f])
        .join(' ');
      const totalWords = combinedText.split(/\s+/).length;
      updates.readingTime = Math.max(1, Math.round(totalWords / 200));
    }

    // If visibility is updated, sync author metadata naming
    if (body.visibility !== undefined) {
      const user = await User.findOne({ clerkId: journey.userId });
      if (user) {
        updates.author = {
          ...journey.author,
          displayName: body.visibility === 'anonymous'
            ? 'Anonymous Perseverer'
            : body.visibility === 'nickname' && body.nickname
            ? body.nickname
            : user.displayName || user.username,
          username: body.visibility === 'public' ? user.username : 'anonymous',
          avatarUrl: body.visibility === 'public'
            ? user.avatarUrl || ''
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          isAnonymous: body.visibility !== 'public',
          nickname: body.visibility === 'nickname' ? body.nickname : undefined,
        };
      }
    }

    const updatedJourney = await Journey.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    await ActivityLog.create({
      userId: session.userId,
      username: session.username || 'unknown',
      action: 'JOURNEY_UPDATE',
      details: `Updated journey: "${journey.title}" (ID: ${id})`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, journey: updatedJourney });
  } catch (error: any) {
    console.error('Error updating journey:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/journeys/[id]
export async function DELETE(
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

    const journey = await Journey.findById(id);
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Check ownership or admin permissions
    const isOwner = journey.userId === session.userId;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not own this journey.' }, { status: 403 });
    }

    // Soft delete by flagging as archived
    await Journey.findByIdAndUpdate(id, { $set: { status: 'archived' } });

    // Decrement user stats
    const user = await User.findOne({ clerkId: journey.userId });
    if (user) {
      const failureCount = journey.timeline.filter((evt: any) => evt.status === 'fail').length;
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          'stats.storiesPublished': -1,
          'stats.rejectionsCount': -failureCount,
        },
      });
    }

    await ActivityLog.create({
      userId: session.userId,
      username: session.username || 'unknown',
      action: 'JOURNEY_DELETE',
      details: `Deleted journey: "${journey.title}" (ID: ${id})`,
      severity: 'warning',
    });

    return NextResponse.json({ success: true, message: 'Journey deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting journey:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
