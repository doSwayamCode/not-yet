import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CounterMetrics } from '@/models/CounterMetrics';

// GET /api/stats/counter
export async function GET() {
  try {
    await connectToDatabase();

    let metrics = await CounterMetrics.findOne({ key: 'global_counter' });

    if (!metrics) {
      // Initialize metrics at 0 to track only real user activities
      metrics = await CounterMetrics.create({
        key: 'global_counter',
        applicationsRejected: 0,
        interviewsFailed: 0,
        hackathonsLost: 0,
        startupsClosed: 0,
        projectsAbandoned: 0,
        lessonsShared: 0,
        peopleHelped: 0,
        storiesPublished: 0,
      });
    }

    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching counter metrics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/stats/counter/increment
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { category, value = 1 } = body;

    const allowedKeys = [
      'applicationsRejected',
      'interviewsFailed',
      'hackathonsLost',
      'startupsClosed',
      'projectsAbandoned',
      'lessonsShared',
      'peopleHelped',
      'storiesPublished',
    ];

    if (!category || !allowedKeys.includes(category)) {
      return NextResponse.json({ error: 'Invalid metric category' }, { status: 400 });
    }

    const updated = await CounterMetrics.findOneAndUpdate(
      { key: 'global_counter' },
      { $inc: { [category]: value } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, metrics: updated });
  } catch (error: any) {
    console.error('Error incrementing counter metrics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
