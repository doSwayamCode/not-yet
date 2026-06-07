'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAppUser } from '@/lib/auth-wrapper';
import { Award, ShieldAlert, BookOpen, Clock, Calendar, CheckCircle2, ChevronRight, PenTool } from 'lucide-react';

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  persistenceScore: number;
  stats: {
    attemptsCount: number;
    rejectionsCount: number;
    lessonsCount: number;
    peopleHelped: number;
    storiesPublished: number;
  };
  achievements: string[];
  createdAt: string;
}

interface JourneyItem {
  _id: string;
  title: string;
  goal: string;
  category: string;
  readingTime: number;
  createdAt: string;
  reactions: any;
}

export default function ProfilePage() {
  const { username } = useParams() as { username: string };
  const { user: currentUser } = useAppUser();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [journeys, setJourneys] = useState<JourneyItem[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Heatmap tooltip state
  const [tooltipText, setTooltipText] = useState('Hover over a square to see rejections.');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profile/${username}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load profile details.');
        }
        setProfile(data.profile);
        setJourneys(data.journeys);
        setHeatmap(data.heatmap || {});
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Profile not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Generate GitHub failure heatmap layout data
  const generateHeatmapGrid = () => {
    const grid: Date[] = [];
    const today = new Date();
    // 365 days ago, start on a Sunday
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay();
    // Align to start on Sunday
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const temp = new Date(startDate);
    while (temp <= today) {
      grid.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return grid;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-neutral-900 border-neutral-950'; // no rejections
    if (count === 1) return 'bg-amber-950/60 border-amber-900/10 text-amber-500'; // light rejection
    if (count === 2) return 'bg-amber-800/80 border-amber-800/30 text-amber-300';
    if (count >= 3) return 'bg-amber-500 border-amber-400 text-black'; // heavy rejection density
    return 'bg-neutral-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider font-mono">Retrieving Persistence Profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#050505] text-white">
        <div className="max-w-md w-full bg-[#0F0F0F] border border-neutral-900 rounded-xl p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Profile Unavailable</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || 'This user profile does not exist.'}</p>
          <Link href="/" className="text-xs bg-amber-500 text-black font-bold px-4 py-2 rounded hover:bg-amber-400 transition">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const heatmapDays = generateHeatmapGrid();
  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-5xl relative z-10 space-y-10">
        
        {/* Profile Card Summary */}
        <div className="bg-[#0F0F0F] border border-neutral-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={profile.displayName}
            className="w-24 h-24 rounded-full border border-neutral-800 object-cover shadow-xl"
          />

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">{profile.displayName}</h1>
              <div className="text-sm text-neutral-400 font-mono">@{profile.username}</div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
              {profile.bio || 'This user is documenting their Chapters 1-19. No bio shared yet.'}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Persistence Score Large badge */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center min-w-[150px] self-stretch flex flex-col justify-center items-center shadow-inner">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Persistence Score</span>
            <span className="text-3xl font-extrabold text-amber-500 font-mono">{profile.persistenceScore}</span>
            <span className="text-[9px] text-neutral-400 mt-1 uppercase tracking-widest font-bold">Level {Math.floor(profile.persistenceScore / 100) + 1} Builder</span>
          </div>
        </div>

        {/* Stats Section grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Attempts Logged', val: profile.stats.attemptsCount },
            { label: 'Rejections Faced', val: profile.stats.rejectionsCount },
            { label: 'Lessons Shared', val: profile.stats.lessonsCount },
            { label: 'People Helped', val: profile.stats.peopleHelped },
            { label: 'Stories Shared', val: profile.stats.storiesPublished },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4 text-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">{stat.label}</span>
              <span className="text-xl font-bold text-white font-mono">{stat.val}</span>
            </div>
          ))}
        </div>

        {/* FAILURE HEATMAP CARD */}
        <div className="bg-[#0F0F0F] border border-neutral-900 rounded-2xl p-6 glow-amber">
          <div className="border-b border-neutral-900 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Failure Heatmap</h3>
              <p className="text-[10px] text-neutral-500">Frequency of rejection events logged in timelines over the past year.</p>
            </div>
            <div className="text-[10px] font-mono bg-neutral-950 border border-neutral-900 text-neutral-400 px-3 py-1.5 rounded-lg max-w-xs truncate">
              {tooltipText}
            </div>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] select-none p-1">
              {heatmapDays.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const count = heatmap[dateStr] || 0;
                const dateDisplay = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setTooltipText(`${count} rejections on ${dateDisplay}`)}
                    onMouseLeave={() => setTooltipText('Hover over a square to see rejections.')}
                    className={`w-3.5 h-3.5 rounded border transition-colors cursor-pointer ${getHeatmapColor(count)}`}
                  ></div>
                );
              })}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-end gap-1.5 text-[9px] text-neutral-500 font-mono mt-3 uppercase tracking-wider">
            <span>No Rejections</span>
            <div className="w-2.5 h-2.5 rounded bg-neutral-900"></div>
            <div className="w-2.5 h-2.5 rounded bg-amber-950/60"></div>
            <div className="w-2.5 h-2.5 rounded bg-amber-800/80"></div>
            <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
            <span>High Density</span>
          </div>
        </div>

        {/* Profile Content Split: Achievements & Stories */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Left: Stories Feed */}
          <div className="md:col-span-8 space-y-6">
            <h2 className="text-lg font-bold border-b border-neutral-900 pb-2">Published Journeys</h2>

            {journeys.length === 0 ? (
              <div className="text-center py-12 bg-[#0F0F0F] border border-neutral-900 rounded-xl text-neutral-500 text-xs italic">
                No public journeys published yet.
              </div>
            ) : (
              <div className="space-y-4">
                {journeys.map((j) => (
                  <div key={j._id} className="p-5 rounded-xl bg-[#0F0F0F] border border-neutral-900 hover:border-neutral-800 transition flex items-center justify-between group">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-amber-500 font-mono">{j.category}</span>
                      <Link href={`/journeys/${j._id}`} className="block text-sm font-bold text-white group-hover:text-amber-400 transition">
                        {j.title}
                      </Link>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Goal: <span className="text-neutral-400 italic">"{j.goal}"</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500">{j.readingTime} min read</span>
                      <Link href={`/journeys/${j._id}`} className="p-1.5 rounded-full bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white transition">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Achievements list */}
          <div className="md:col-span-4 space-y-6">
            <h2 className="text-lg font-bold border-b border-neutral-900 pb-2">Achievements</h2>

            <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 space-y-4">
              {profile.achievements?.length === 0 ? (
                <p className="text-xs text-neutral-500 italic text-center py-4">No achievements unlocked yet.</p>
              ) : (
                <div className="space-y-3">
                  {profile.achievements?.map((ach, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-900">
                      <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{ach}</div>
                        <div className="text-[9px] text-neutral-500">Unlocked Badge</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sharing/Call to action */}
            {isOwnProfile && (
              <Link
                href="/share"
                className="w-full py-3 rounded-lg bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-400 transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                Share Another Chapter
              </Link>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
