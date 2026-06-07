import React from 'react';
import Link from 'next/link';
import SignatureAnimation from '@/components/SignatureAnimation';
import GlobalCounter from '@/components/GlobalCounter';
import { ArrowRight, BookOpen, PenTool, Compass, CompassIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-x-hidden flex flex-col">
      {/* 3D Particle Signature Canvas */}
      <SignatureAnimation />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col items-center justify-center min-h-[85vh] text-center">
        {/* Subtle top indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-medium tracking-wide mb-6 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Now Open: A Living Archive of Human Persistence
        </div>

        {/* Narrative Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-white mb-6 select-none leading-none">
          Everyone celebrates <span className="text-neutral-500 font-light block sm:inline">Chapter 20.</span>
          <br className="hidden sm:block" />
          We collect <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Chapters 1–19.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
          The world's archive of rejection letters, failed interviews, pivots, lost competitions, burnout, and comebacks. Because every success is built on a "Not Yet."
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md z-20">
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition duration-300"
          >
            <BookOpen className="w-4 h-4" />
            Read Journeys
          </Link>
          <Link
            href="/share"
            className="flex items-center justify-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-900 transition duration-300"
          >
            <PenTool className="w-4 h-4" />
            Share Your Story
          </Link>
        </div>

        {/* Scroll helper indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 text-[10px] uppercase tracking-widest text-neutral-500">
          <span>Scroll to connect timelines</span>
          <div className="w-1.5 h-6 rounded-full bg-neutral-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Mission / Detail Explanation Section */}
      <section className="relative z-10 border-t border-neutral-900 bg-[#070707] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-2 block">Our Core Mission</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
                This is not a failure platform. This is a platform for persistence.
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-6">
                The internet is flooded with outcome celebration posts. Offer letters, funding rounds, and winning trophies are polished and broadcast.
              </p>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-6">
                But the years of uncertainty, the 100+ rejection emails, the failed whiteboard tests, and the abandoned code repositories remain hidden. We believe those chapters contain the real details of who we are.
              </p>
              <div className="p-4 border-l-2 border-amber-500 bg-neutral-950/40 rounded-r-lg">
                <p className="text-xs font-mono text-neutral-400 italic">
                  "Every rejection is simply a bookmark in the book of your journey, marking the page where you learned, adjusted, and decided to keep going."
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-xl border border-neutral-900 bg-[#0F0F0F] hover:border-neutral-800 transition">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Document rejections, not outcomes
                </h3>
                <p className="text-xs text-neutral-400">
                  Build timelines mapping every obstacle. Share what went wrong, your lowest points, and your lessons learned.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-neutral-900 bg-[#0F0F0F] hover:border-neutral-800 transition">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Absolute posting privacy
                </h3>
                <p className="text-xs text-neutral-400">
                  Post anonymously, under a selected pen name, or connect it to your public verified profile. Your comfort is our priority.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-neutral-900 bg-[#0F0F0F] hover:border-neutral-800 transition">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Positive community reactions
                </h3>
                <p className="text-xs text-neutral-400">
                  No toxic likes or criticisms. React with "relatable", "been there", "inspired me" or "needed this" to build solidarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Counters Section */}
      <section className="relative z-10 py-20 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">The Pulse of Persistence</h2>
          <p className="text-xs text-neutral-500">Updated live by our global community sharing their attempts.</p>
        </div>
        <GlobalCounter />
      </section>

      {/* Interactive Archive Showcase */}
      <section className="relative z-10 py-16 bg-[#070707] border-t border-b border-neutral-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to enter the archive?</h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-sm mb-8">
            Explore thousands of unfiltered accounts of persistence categorized by careers, startups, academic paths, and personal projects.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition"
            >
              Explore the Archive
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
