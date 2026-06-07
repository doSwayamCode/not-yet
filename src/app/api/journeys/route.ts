import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { Journey } from '@/models/Journey';
import { User } from '@/models/User';
import { CounterMetrics } from '@/models/CounterMetrics';
import { ActivityLog } from '@/models/ActivityLog';
import { getServerAuth } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';

const timelineEventSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(2, 'Event title is required'),
  description: z.string().min(2, 'Description is required'),
  status: z.enum(['fail', 'success', 'milestone', 'pending']),
});

const journeyCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  goal: z.string().min(5, 'Goal must be at least 5 characters'),
  category: z.string().min(2, 'Category is required'),
  tags: z.array(z.string()).default([]),
  timeline: z.array(timelineEventSchema).min(1, 'Timeline must have at least one event'),
  whatHappened: z.string().min(50, 'What happened must be at least 50 characters'),
  lowestPoint: z.string().min(10, 'Lowest point must be at least 10 characters'),
  biggestMistake: z.string().min(10, 'Biggest mistake must be at least 10 characters'),
  whatChanged: z.string().min(10, 'What changed must be at least 10 characters'),
  whatLearned: z.string().min(10, 'What I learned must be at least 10 characters'),
  advice: z.string().min(10, 'Advice must be at least 10 characters'),
  currentStatus: z.string().min(2, 'Current status is required'),
  reflection: z.string().min(10, 'Reflection must be at least 10 characters'),
  visibility: z.enum(['public', 'anonymous', 'nickname']),
  nickname: z.string().optional(),
});

// GET /api/journeys
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    // Parse filters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const author = searchParams.get('author');
    const query = searchParams.get('q');
    const sort = searchParams.get('sort') || 'newest'; // newest, trending, relatable

    const filter: any = { status: 'active', isPublished: true };

    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (author) {
      filter['author.username'] = author;
    }

    // Keyword search
    if (query) {
      // If MongoDB Atlas Search index is not configured, we fall back to regex search
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { goal: { $regex: query, $options: 'i' } },
        { whatHappened: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    // Sort order
    let sortOptions: any = { createdAt: -1 };
    if (sort === 'trending') {
      // Sorting by total reactions + comments
      sortOptions = { 'reactions.relatable': -1, createdAt: -1 };
    } else if (sort === 'relatable') {
      sortOptions = { 'reactions.relatable': -1, 'reactions.beenThere': -1 };
    }

    // Execute queries
    const journeys = await Journey.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await Journey.countDocuments(filter);

    return NextResponse.json({
      success: true,
      journeys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching journeys:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/journeys
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Auth Check
    const session = await getServerAuth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting - 5 posts per hour
    const limiter = await rateLimit(`post_journey:${session.userId}`, 5, 3600);
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many journeys submitted recently. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const validated = journeyCreateSchema.parse(body);

    // Calculate reading time (~200 words per minute)
    const totalWords = [
      validated.whatHappened,
      validated.lowestPoint,
      validated.biggestMistake,
      validated.whatChanged,
      validated.whatLearned,
      validated.advice,
      validated.reflection,
    ].join(' ').split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(totalWords / 200));

    // Get User for metadata and points
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
        details: `Registered user: ${user.username} during journey submission`,
        severity: 'info',
      });
    }

    // Determine author profile exposure
    const authorMetadata = {
      displayName: validated.visibility === 'anonymous'
        ? 'Anonymous Perseverer'
        : validated.visibility === 'nickname' && validated.nickname
        ? validated.nickname
        : user.displayName || user.username,
      username: validated.visibility === 'public' ? user.username : 'anonymous',
      avatarUrl: validated.visibility === 'public'
        ? user.avatarUrl || ''
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', // generic avatar
      isAnonymous: validated.visibility !== 'public',
      nickname: validated.visibility === 'nickname' ? validated.nickname : undefined,
    };

    // Create the journey
    const newJourney = await Journey.create({
      userId: session.userId,
      author: authorMetadata,
      title: validated.title,
      goal: validated.goal,
      category: validated.category,
      tags: validated.tags,
      timeline: validated.timeline,
      whatHappened: validated.whatHappened,
      lowestPoint: validated.lowestPoint,
      biggestMistake: validated.biggestMistake,
      whatChanged: validated.whatChanged,
      whatLearned: validated.whatLearned,
      advice: validated.advice,
      currentStatus: validated.currentStatus,
      reflection: validated.reflection,
      readingTime,
      visibility: validated.visibility,
      isPublished: true,
      status: 'active',
      commentsCount: 0,
      reactions: { relatable: 0, beenThere: 0, learnedSomething: 0, inspiredMe: 0, neededThis: 0, respect: 0 },
    });

    // Calculate Persistence Score increase:
    // +50 points for sharing a story
    // +10 points per rejection (status = 'fail') in the timeline
    const failureCount = validated.timeline.filter((evt) => evt.status === 'fail').length;
    const interviewCount = validated.timeline.filter((evt) => evt.title.toLowerCase().includes('interview') && evt.status === 'fail').length;
    const startupCount = validated.timeline.filter((evt) => evt.title.toLowerCase().includes('startup') && evt.status === 'fail').length;
    const hackathonCount = validated.timeline.filter((evt) => evt.title.toLowerCase().includes('hackathon') && evt.status === 'fail').length;
    const projectCount = validated.timeline.filter((evt) => evt.title.toLowerCase().includes('project') && evt.status === 'fail').length;

    const pointsEarned = 50 + (failureCount * 10);

    // Update User Stats & Score
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        persistenceScore: pointsEarned,
        'stats.storiesPublished': 1,
        'stats.attemptsCount': validated.timeline.length,
        'stats.rejectionsCount': failureCount,
        'stats.lessonsCount': 1,
      },
    });

    // Update global counters (live database counter)
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
          peopleHelped: 5, // mock weight for publishing
          storiesPublished: 1,
        },
      },
      { upsert: true, new: true }
    );

    // Log this system event
    await ActivityLog.create({
      userId: session.userId,
      username: user.username,
      action: 'JOURNEY_CREATE',
      details: `Created journey: "${validated.title}" earning ${pointsEarned} points. Visibility: ${validated.visibility}`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, journey: newJourney, pointsEarned });
  } catch (error: any) {
    console.error('Error creating journey:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
