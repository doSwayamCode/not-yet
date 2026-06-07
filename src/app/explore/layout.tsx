import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Interview Experiences & Rejection Stories | notYET',
  description: 'Search and filter real interview experiences, tech interview failures, startup pivots, and career comebacks from professionals in India and abroad.',
  keywords: ['interview experiences', 'interview experiences India', 'abroad interview experiences', 'tech interviews', 'non-tech interviews', 'rejection stories', 'startup failures', 'career comebacks'],
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
