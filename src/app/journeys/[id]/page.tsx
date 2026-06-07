'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppUser } from '@/lib/auth-wrapper';
import {
  Clock,
  ArrowLeft,
  BookOpen,
  Eye,
  Maximize2,
  Minimize2,
  Share2,
  Pin,
  Send,
  Heart,
  MessageSquare,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  status: 'fail' | 'success' | 'milestone' | 'pending';
}

interface JourneyDetails {
  _id: string;
  userId: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isAnonymous: boolean;
  };
  title: string;
  goal: string;
  category: string;
  tags: string[];
  timeline: TimelineEvent[];
  whatHappened: string;
  lowestPoint: string;
  biggestMistake: string;
  whatChanged: string;
  whatLearned: string;
  advice: string;
  currentStatus: string;
  reflection: string;
  readingTime: number;
  reactions: {
    relatable: number;
    beenThere: number;
    learnedSomething: number;
    inspiredMe: number;
    neededThis: number;
    respect: number;
  };
  commentsCount: number;
  createdAt: string;
}

interface CommentItem {
  _id: string;
  journeyId: string;
  userId: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isAnonymous: boolean;
  };
  content: string;
  parentId: string | null;
  isPinned: boolean;
  createdAt: string;
}

const REACTION_EMOJIS: Record<string, { label: string; emoji: string }> = {
  relatable: { label: 'Relatable', emoji: '🤝' },
  beenThere: { label: 'Been There', emoji: '🎒' },
  learnedSomething: { label: 'Learned Something', emoji: '💡' },
  inspiredMe: { label: 'Inspired Me', emoji: '✨' },
  neededThis: { label: 'Needed This', emoji: '❤️' },
  respect: { label: 'Respect', emoji: '✊' },
};

export default function JourneyDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { isSignedIn, user } = useAppUser();

  const [journey, setJourney] = useState<JourneyDetails | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Interactive States
  const [focusMode, setFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [commentVisibility, setCommentVisibility] = useState<'public' | 'anonymous'>('public');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Journey Details
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Journey
      const journeyRes = await fetch(`/api/journeys/${id}`);
      const journeyData = await journeyRes.json();
      if (!journeyRes.ok || !journeyData.success) {
        throw new Error(journeyData.error || 'Failed to fetch journey details.');
      }
      setJourney(journeyData.journey);

      // 2. Fetch Comments
      const commentsRes = await fetch(`/api/journeys/${id}/comments`);
      const commentsData = await commentsRes.json();
      if (commentsRes.ok && commentsData.success) {
        setComments(commentsData.comments);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Reading Progress scroll tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress((scrollTop / docHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // React to journey handler
  const handleReact = async (type: string) => {
    if (!isSignedIn) {
      alert('Please sign in (using the simulation tray on the bottom-right) to react to stories.');
      return;
    }

    try {
      const res = await fetch(`/api/journeys/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update reactions counter locally
        if (journey) {
          const change = data.action === 'added' ? 1 : -1;
          setJourney({
            ...journey,
            reactions: {
              ...journey.reactions,
              [type]: Math.max(0, (journey.reactions[type as keyof typeof journey.reactions] || 0) + change),
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Add Comment handler
  const handleAddComment = async (parentId: string | null = null) => {
    if (!isSignedIn) {
      alert('Please log in to leave comments.');
      return;
    }

    const content = parentId ? replyInput : commentInput;
    if (!content.trim()) return;

    try {
      const res = await fetch(`/api/journeys/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
          visibility: commentVisibility,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.comment]);
        if (parentId) {
          setReplyInput('');
          setActiveReplyId(null);
        } else {
          setCommentInput('');
        }
        // Increment commentsCount locally
        if (journey) {
          setJourney({
            ...journey,
            commentsCount: journey.commentsCount + 1,
          });
        }
      } else {
        alert(data.error || 'Failed to post comment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Share Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider font-mono">Loading Journey Files...</span>
        </div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#050505] text-white">
        <div className="max-w-md w-full bg-[#0F0F0F] border border-neutral-900 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Journey Unavailable</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || 'The journey you are looking for has been archived or deleted.'}</p>
          <Link href="/explore" className="text-xs bg-amber-500 text-black font-bold px-4 py-2 rounded hover:bg-amber-400 transition">
            Return to Archive
          </Link>
        </div>
      </div>
    );
  }

  // Group comments: main thread comments and children
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className={`min-h-screen bg-[#050505] text-white transition-colors duration-300 relative ${focusMode ? 'pb-32' : 'py-12 pb-24'}`}>
      
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-900 z-50">
        <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Focus Controls (Hide when in Focus mode) */}
        {!focusMode && (
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Archive
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFocusMode(true)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-900 px-3 py-1.5 rounded-lg transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Focus Mode
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-900 px-3 py-1.5 rounded-lg transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Copied!' : 'Share Logs'}
              </button>
            </div>
          </div>
        )}

        {/* Floating Focus Mode Close Button */}
        {focusMode && (
          <button
            onClick={() => setFocusMode(false)}
            className="fixed top-6 right-6 z-50 bg-[#0F0F0F] border border-neutral-800 text-neutral-400 hover:text-white p-2.5 rounded-full shadow-2xl transition hover:scale-105 flex items-center gap-1 text-xs"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Focus</span>
          </button>
        )}

        {/* DOCUMENT METADATA */}
        <article className="prose prose-invert max-w-none space-y-12">
          
          {/* Header Metadata */}
          <div className="text-center md:text-left border-b border-neutral-900 pb-10">
            <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-neutral-500 mb-4 font-mono">
              <span className="text-amber-500 font-bold uppercase tracking-wider">{journey.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {journey.readingTime} min read</span>
              <span>•</span>
              <span>Published {new Date(journey.createdAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight max-w-3xl">
              {journey.title}
            </h1>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <img
                src={journey.author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={journey.author.displayName}
                className="w-8 h-8 rounded-full border border-neutral-800 object-cover"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-white">{journey.author.displayName}</div>
                <div className="text-[10px] text-neutral-500">
                  {journey.author.isAnonymous ? 'Simulated author badge' : `@${journey.author.username}`}
                </div>
              </div>
            </div>
          </div>

          {/* Documentary Narrative Sections */}
          <div className="grid md:grid-cols-12 gap-8 pt-4">
            
            {/* Left Narrative Content */}
            <div className="md:col-span-8 space-y-10">
              
              <section className="bg-[#0F0F0F]/30 p-5 rounded-xl border border-neutral-900/60">
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-neutral-500 mb-3">Goal Context</h2>
                <p className="text-lg font-medium text-neutral-200 leading-relaxed font-serif italic">
                  "{journey.goal}"
                </p>
              </section>

              <section>
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-amber-500 mb-3">The Journal: What Happened</h2>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
                  {journey.whatHappened}
                </p>
              </section>

              <section className="grid sm:grid-cols-2 gap-6 border-t border-b border-neutral-900 py-8">
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-rose-500 mb-2">The Lowest Point</h3>
                  <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {journey.lowestPoint}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400 mb-2">Biggest Mistake Made</h3>
                  <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {journey.biggestMistake}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-amber-500 mb-3">The Pivot: What Changed</h2>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {journey.whatChanged}
                </p>
              </section>

              <section className="bg-neutral-950/60 p-5 rounded-xl border border-neutral-900">
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-emerald-500 mb-3">Core Lessons Learned</h2>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                  {journey.whatLearned}
                </p>
              </section>

              <section>
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-amber-500 mb-3">Advice for Builders</h2>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {journey.advice}
                </p>
              </section>

              <section className="border-t border-neutral-900 pt-8">
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-neutral-500 mb-2">Reflection & Present View</h2>
                <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line">
                  {journey.reflection}
                </p>
              </section>

            </div>

            {/* Right Interactive Sidebar / Vertical Timeline */}
            <div className="md:col-span-4 space-y-8">
              
              {/* VERTICAL TIMELINE TREE */}
              <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 glow-amber">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white mb-6 border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Attempt Milestones
                </h3>

                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-neutral-800">
                  {journey.timeline?.map((evt, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0F0F0F] z-10 ${
                          evt.status === 'fail'
                            ? 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            : evt.status === 'success'
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        }`}
                      ></span>

                      <span className="block text-[10px] font-mono text-neutral-500 uppercase">{evt.date}</span>
                      <h4 className="text-xs font-bold text-neutral-200 mt-0.5">{evt.title}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CURRENT STATUS */}
              <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Current State</span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {journey.currentStatus}
                </span>
              </div>

            </div>

          </div>

        </article>

        {/* FOCUS MODE BARRIER - DO NOT RENDER SOCIAL/COMMENTS IF FOCUS MODE */}
        {!focusMode && (
          <div className="border-t border-neutral-900 mt-16 pt-10 space-y-12">
            
            {/* SOLIDARITY REACTIONS SYSTEM */}
            <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6">
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 mb-4 text-center sm:text-left">
                Respond with Solidarity
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.keys(REACTION_EMOJIS).map((key) => {
                  const item = REACTION_EMOJIS[key];
                  const count = journey.reactions[key as keyof typeof journey.reactions] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => handleReact(key)}
                      className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition group hover:scale-[1.02]"
                    >
                      <span className="text-2xl mb-1 filter group-hover:scale-110 transition">{item.emoji}</span>
                      <span className="text-[10px] font-semibold text-neutral-400">{item.label}</span>
                      <span className="text-xs font-bold text-white mt-1 font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMMENTS SECTION */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-neutral-900 pb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-neutral-500" />
                Discussion ({journey.commentsCount})
              </h3>

              {/* Post comment box */}
              {isSignedIn ? (
                <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="font-bold text-white">Commenting as:</span>
                      <select
                        value={commentVisibility}
                        onChange={(e: any) => setCommentVisibility(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-2 py-0.5 text-xs"
                      >
                        <option value="public">Public (Name & Avatar)</option>
                        <option value="anonymous">Anonymous Badge</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write a supportive comment, ask a question, or share your thoughts..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-xs text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleAddComment(null)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post Comment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0F0F0F]/50 border border-neutral-900/60 rounded-xl p-5 text-center text-xs text-neutral-500">
                  Please log in (using the simulation tray) to participate in the conversation.
                </div>
              )}

              {/* Threaded Comments list */}
              {rootComments.length === 0 ? (
                <div className="text-center py-10 border border-neutral-900/40 rounded-xl text-neutral-500 text-xs italic">
                  No comments yet. Start the conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {rootComments.map((cmt) => {
                    const replies = getReplies(cmt._id);
                    return (
                      <div key={cmt._id} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 space-y-4">
                        
                        {/* Comment Header */}
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <div className="flex items-center gap-2">
                            <img
                              src={cmt.author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                              alt={cmt.author.displayName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-bold text-white">{cmt.author.displayName}</span>
                            <span className="text-[10px] text-neutral-500">@{cmt.author.username}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {new Date(cmt.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Comment Content */}
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans pl-7">
                          {cmt.content}
                        </p>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 pl-7 text-[10px] text-neutral-500">
                          <button
                            onClick={() => {
                              setActiveReplyId(cmt._id);
                              setReplyInput('');
                            }}
                            className="hover:text-white transition font-bold"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Reply input box */}
                        {activeReplyId === cmt._id && (
                          <div className="pl-7 mt-3 space-y-2 border-l border-neutral-800">
                            <textarea
                              rows={2}
                              placeholder="Write your reply..."
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-1.5 text-xs text-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setActiveReplyId(null)}
                                className="px-3 py-1 bg-neutral-900 text-neutral-400 hover:text-white text-[10px] rounded transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddComment(cmt._id)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] rounded transition"
                              >
                                Post Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies list */}
                        {replies.length > 0 && (
                          <div className="pl-7 space-y-3 border-l border-neutral-900 mt-4">
                            {replies.map((reply) => (
                              <div key={reply._id} className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-900/60 text-xs">
                                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={reply.author.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                      alt={reply.author.displayName}
                                      className="w-4 h-4 rounded-full object-cover"
                                    />
                                    <span className="font-bold text-white">{reply.author.displayName}</span>
                                    <span className="text-[9px] text-neutral-500">@{reply.author.username}</span>
                                  </div>
                                  <span className="text-[9px] text-neutral-500 font-mono">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-neutral-300 leading-relaxed font-sans pl-5.5">
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
