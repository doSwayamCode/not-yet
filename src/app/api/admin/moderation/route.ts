import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Journey, type ITimelineEvent } from '@/models/Journey';
import { Comment } from '@/models/Comment';
import { ActivityLog } from '@/models/ActivityLog';
import { CounterMetrics } from '@/models/CounterMetrics';
import { User } from '@/models/User';
import { requireAdmin } from '@/lib/auth-server';

// POST /api/admin/moderation
export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Guard - Admin only
    let session;
    try {
      session = await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { targetType, targetId, action } = body; // targetType: 'journey'|'comment', action: 'approve'|'reject'

    if (!targetType || !targetId || !action) {
      return NextResponse.json({ error: 'Missing parameters. Need targetType, targetId, and action.' }, { status: 400 });
    }

    if (targetType === 'journey') {
      const journey = await Journey.findById(targetId);
      if (!journey) {
        return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
      }

      if (action === 'approve') {
        const wasPendingApproval = !journey.isPublished;

        await Journey.findByIdAndUpdate(targetId, { $set: { status: 'active', isPublished: true } });

        if (wasPendingApproval) {
          const timeline = journey.timeline as ITimelineEvent[];
          const failureCount = timeline.filter((evt) => evt.status === 'fail').length;
          const interviewCount = timeline.filter((evt) => evt.title.toLowerCase().includes('interview') && evt.status === 'fail').length;
          const startupCount = timeline.filter((evt) => evt.title.toLowerCase().includes('startup') && evt.status === 'fail').length;
          const hackathonCount = timeline.filter((evt) => evt.title.toLowerCase().includes('hackathon') && evt.status === 'fail').length;
          const projectCount = timeline.filter((evt) => evt.title.toLowerCase().includes('project') && evt.status === 'fail').length;
          const pointsEarned = 50 + (failureCount * 10);
          const user = await User.findOne({ clerkId: journey.userId });

          if (user) {
            await User.findByIdAndUpdate(user._id, {
              $inc: {
                persistenceScore: pointsEarned,
                'stats.storiesPublished': 1,
                'stats.attemptsCount': timeline.length,
                'stats.rejectionsCount': failureCount,
                'stats.lessonsCount': 1,
              },
            });
          }

          await CounterMetrics.findOneAndUpdate(
            { key: 'global_counter' },
            {
              $inc: {
                applicationsRejected: failureCount,
                interviewsFailed: interviewCount,
                hackathonsLost: hackathonCount,
                startupsClosed: startupCount,
                projectsAbandoned: projectCount,
                lessonsShared: 1,
                peopleHelped: 5,
                storiesPublished: 1,
              },
            },
            { upsert: true, new: true }
          );
        }

        await ActivityLog.create({
          userId: session.userId,
          username: session.username || 'admin',
          action: 'MODERATION_APPROVE_JOURNEY',
          details: `Approved journey ID: ${targetId} ("${journey.title}")`,
          severity: 'info',
        });
      } else if (action === 'reject') {
        // Archive (soft delete) journey
        await Journey.findByIdAndUpdate(targetId, { $set: { status: 'archived', isPublished: false } });
        await ActivityLog.create({
          userId: session.userId,
          username: session.username || 'admin',
          action: 'MODERATION_REJECT_JOURNEY',
          details: `Rejected & archived journey ID: ${targetId} ("${journey.title}")`,
          severity: 'danger',
        });
      } else if (action === 'delete') {
        // Permanent delete
        await Journey.deleteOne({ _id: targetId });
        await ActivityLog.create({
          userId: session.userId,
          username: session.username || 'admin',
          action: 'MODERATION_DELETE_JOURNEY',
          details: `Permanently deleted journey ID: ${targetId} ("${journey.title}")`,
          severity: 'danger',
        });
      }
    } else if (targetType === 'comment') {
      const comment = await Comment.findById(targetId);
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      if (action === 'approve') {
        // Clear comment flag status
        await Comment.findByIdAndUpdate(targetId, { $set: { isFlagged: false } });
        await ActivityLog.create({
          userId: session.userId,
          username: session.username || 'admin',
          action: 'MODERATION_APPROVE_COMMENT',
          details: `Approved flagged comment ID: ${targetId}`,
          severity: 'info',
        });
      } else if (action === 'reject') {
        // Delete comment permanently or set flagged status
        await Comment.deleteOne({ _id: targetId });
        // Decrement comment count on Journey
        await Journey.findByIdAndUpdate(comment.journeyId, { $inc: { commentsCount: -1 } });
        
        await ActivityLog.create({
          userId: session.userId,
          username: session.username || 'admin',
          action: 'MODERATION_REJECT_COMMENT',
          details: `Rejected & deleted comment ID: ${targetId} from journey ID: ${comment.journeyId}`,
          severity: 'danger',
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Successfully resolved flagged ${targetType} with action: ${action}` });
  } catch (error: any) {
    console.error('Moderation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
