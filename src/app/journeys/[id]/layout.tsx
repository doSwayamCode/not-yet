import { Metadata } from 'next';
import { connectToDatabase } from '@/lib/db';
import { Journey } from '@/models/Journey';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  // read route params
  const { id } = await params;

  try {
    await connectToDatabase();
    const journey = await Journey.findById(id);
    
    if (!journey) {
      return {
        title: 'Journey Not Found | notYET',
      };
    }

    return {
      title: `${journey.title} - Interview Experience & Story | notYET`,
      description: `Read about this interview experience and failure story: ${journey.goal}. A real journey shared on notYET.`,
      keywords: [...(journey.tags || []), journey.category, 'interview experience', 'failure story', 'interview experience India', 'tech interview', 'career journey'],
      openGraph: {
        title: `${journey.title} | notYET`,
        description: journey.goal,
      },
    };
  } catch (error) {
    return {
      title: 'Journey | notYET',
    };
  }
}

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
