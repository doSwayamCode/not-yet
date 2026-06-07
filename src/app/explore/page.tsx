'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, BookOpen, Clock, Heart, Award, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

interface JourneyItem {
  _id: string;
  title: string;
  goal: string;
  category: string;
  tags: string[];
  readingTime: number;
  createdAt: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isAnonymous: boolean;
  };
  timeline: Array<{
    date: string;
    title: string;
    status: string;
  }>;
  reactions: {
    relatable: number;
    beenThere: number;
    learnedSomething: number;
    inspiredMe: number;
    neededThis: number;
    respect: number;
  };
  commentsCount: number;
}

const CATEGORIES = [
  'All',
  'Careers',
  'Startups',
  'Academics',
  'Hackathons',
  'Personal Projects',
  'Other',
];

export default function ExplorePage() {
  const [journeys, setJourneys] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest'); // newest, trending, relatable
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      let url = `/api/journeys?page=${page}&limit=${limit}&sort=${sort}`;
      if (category !== 'All') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (search.trim()) {
        url += `&q=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJourneys(data.journeys);
        setTotalPages(data.pagination.pages);
      }
    } catch (e) {
      console.error('Failed to load journeys:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [category, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJourneys();
  };

  const getReactionCount = (reactions: any) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);
  };

  const getFailureCount = (timeline: any[]) => {
    if (!timeline) return 0;
    return timeline.filter((e) => e.status === 'fail').length;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">THE ARCHIVE</h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl">
            Read unfiltered logs of attempts, pivots, and failures shared by builders, students, and founders.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Search rejections, goals, or technologies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 pl-10 text-sm transition"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
            </div>

            <div className="md:col-span-3">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-4 py-2.5 text-sm transition text-neutral-300"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="trending">Sort: Trending</option>
                <option value="relatable">Sort: Most Relatable</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-amber-500 text-black font-semibold rounded-lg text-sm py-2.5 hover:bg-amber-400 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
                  category === cat
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Journeys Feed */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 h-80 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="w-16 h-4 bg-neutral-800 rounded mb-4"></div>
                  <div className="w-full h-6 bg-neutral-800 rounded mb-2"></div>
                  <div className="w-3/4 h-6 bg-neutral-800 rounded"></div>
                </div>
                <div className="w-1/2 h-4 bg-neutral-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : journeys.length === 0 ? (
          <div className="text-center py-16 bg-[#0F0F0F] border border-neutral-900 rounded-xl">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No journeys found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
              Try adjusting your keyword query, choosing a different category, or check back later!
            </p>
            <Link
              href="/share"
              className="inline-flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-4 py-2 text-xs font-semibold rounded hover:bg-neutral-900 transition"
            >
              Share Your Journey
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journeys.map((journey) => {
                const failureCount = getFailureCount(journey.timeline);
                return (
                  <div
                    key={journey._id}
                    className="group flex flex-col justify-between p-5 rounded-xl bg-[#0F0F0F] border border-neutral-900 hover:border-neutral-800 transition duration-300 relative hover:shadow-xl"
                  >
                    <div>
                      {/* Top Author Details */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 px-2 py-0.5 rounded bg-amber-500/10">
                          {journey.category}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <img
                            src={journey.author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={journey.author.displayName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs text-neutral-400">
                            {journey.author.isAnonymous ? (
                              'Anonymous'
                            ) : (
                              <Link href={`/profile/${journey.author.username}`} className="hover:underline text-neutral-300">
                                @{journey.author.username}
                              </Link>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Title & Goal */}
                      <Link href={`/journeys/${journey._id}`} className="block group-hover:text-amber-400 transition-colors mb-2">
                        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                          {journey.title}
                        </h3>
                      </Link>
                      
                      <div className="text-xs text-neutral-500 mb-4 font-mono line-clamp-1 border-b border-neutral-900/60 pb-2">
                        Goal: <span className="text-neutral-400 italic">"{journey.goal}"</span>
                      </div>

                      {/* Timeline Summary dots */}
                      <div className="flex items-center gap-1.5 mb-6 text-xs text-neutral-400">
                        <Award className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Timeline:</span>
                        <div className="flex gap-1">
                          {journey.timeline?.slice(0, 5).map((evt, idx) => (
                            <span
                              key={idx}
                              title={`${evt.title} (${evt.status})`}
                              className={`w-2.5 h-2.5 rounded-full inline-block ${
                                evt.status === 'fail'
                                  ? 'bg-rose-500'
                                  : evt.status === 'success'
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-400'
                              }`}
                            ></span>
                          ))}
                          {journey.timeline?.length > 5 && (
                            <span className="text-[9px] text-neutral-600 font-bold self-center">
                              +{journey.timeline.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between border-t border-neutral-900/80 pt-4 text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{journey.readingTime} min read</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500/80" />
                          {getReactionCount(journey.reactions)}
                        </span>
                        <Link
                          href={`/journeys/${journey._id}`}
                          className="font-bold text-amber-500 hover:text-amber-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                        >
                          Read Logs
                          <BookOpen className="w-3 h-3 ml-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 border border-neutral-800 bg-[#0F0F0F] hover:bg-neutral-950 rounded-lg text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400 font-mono">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 border border-neutral-800 bg-[#0F0F0F] hover:bg-neutral-950 rounded-lg text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
