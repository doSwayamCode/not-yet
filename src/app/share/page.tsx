'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppUser } from '@/lib/auth-wrapper';
import { PenTool, Plus, Trash, ArrowRight, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  status: 'fail' | 'success' | 'milestone' | 'pending';
}

export default function SharePage() {
  const router = useRouter();
  const { isSignedIn, user, isMock } = useAppUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState('Careers');
  const [tagsInput, setTagsInput] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [lowestPoint, setLowestPoint] = useState('');
  const [biggestMistake, setBiggestMistake] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [whatLearned, setWhatLearned] = useState('');
  const [advice, setAdvice] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Still Applying');
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'anonymous' | 'nickname'>('public');
  const [nickname, setNickname] = useState('');

  // Dynamic Timeline
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { date: '', title: '', description: '', status: 'fail' },
  ]);

  const addTimelineEvent = () => {
    setTimeline([...timeline, { date: '', title: '', description: '', status: 'fail' }]);
  };

  const updateTimelineEvent = (index: number, field: keyof TimelineEvent, value: string) => {
    const updated = [...timeline];
    updated[index] = { ...updated[index], [field]: value };
    setTimeline(updated);
  };

  const removeTimelineEvent = (index: number) => {
    if (timeline.length === 1) return;
    setTimeline(timeline.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic Validation
    if (!title || !goal || !whatHappened || !lowestPoint || !biggestMistake || !whatChanged || !whatLearned || !advice || !reflection) {
      setError('Please fill in all required text fields.');
      setLoading(false);
      return;
    }

    if (visibility === 'nickname' && !nickname) {
      setError('Please provide a Pen Name/Nickname.');
      setLoading(false);
      return;
    }

    // Filter timeline events that have empty values
    const filteredTimeline = timeline.filter((evt) => evt.date && evt.title && evt.description);
    if (filteredTimeline.length === 0) {
      setError('Your timeline must have at least one completed event.');
      setLoading(false);
      return;
    }

    // Process Tags
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          goal,
          category,
          tags,
          timeline: filteredTimeline,
          whatHappened,
          lowestPoint,
          biggestMistake,
          whatChanged,
          whatLearned,
          advice,
          currentStatus,
          reflection,
          visibility,
          nickname: visibility === 'nickname' ? nickname : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit journey');
      }

      // Sync user profile stats after posting (if mock user)
      if (isMock) {
        await fetch('/api/auth/sync', { method: 'POST' });
      }

      router.push(`/journeys/${data.journey._id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Guard: Not Logged In
  if (!isSignedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#050505] text-white">
        <div className="max-w-md w-full bg-[#0F0F0F] border border-neutral-900 rounded-xl p-8 text-center glow-amber">
          <PenTool className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Share your "Not Yet"</h2>
          <p className="text-xs text-neutral-400 mb-6">
            You must be logged in to contribute to the archive. Please log in using the bottom right simulation tray or Clerk button.
          </p>
          <div className="text-[10px] text-neutral-600 bg-neutral-950 p-3 rounded font-mono border border-neutral-900">
            Click any profile in the "Mock Auth Mode" drawer on the bottom-right to sign in instantly.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">SHARE YOUR JOURNEY</h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            Document Chapters 1-19. Your rejections are lessons. Your story is a map for others.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Privacy and Meta */}
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-900 pb-4 mb-4">
              <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest">1. Context & Privacy</h2>
              <p className="text-[11px] text-neutral-500">Specify what you were pursuing and who can see your name.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Journey Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11 rejections before Google placement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">The Ultimate Goal *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Landing a Software Engineering job"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition text-neutral-300"
                >
                  <option value="Careers">Careers & Placement</option>
                  <option value="Startups">Startups & Funding</option>
                  <option value="Academics">Academics & Research</option>
                  <option value="Hackathons">Hackathons & Competitions</option>
                  <option value="Personal Projects">Personal Projects</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. faang, engineering, coding"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Current Status *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preparing for interviews, Pivoting"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition"
                />
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-4 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Who is sharing? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                      className="accent-amber-500"
                    />
                    <span>Public Profile (@{user?.username})</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'anonymous'}
                      onChange={() => setVisibility('anonymous')}
                      className="accent-amber-500"
                    />
                    <span>Anonymous</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'nickname'}
                      onChange={() => setVisibility('nickname')}
                      className="accent-amber-500"
                    />
                    <span>Pen Name</span>
                  </label>
                </div>
              </div>

              {visibility === 'nickname' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Pen Name / Nickname *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. weary_builder, coding_novice"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Narrative Logs */}
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-900 pb-4 mb-4">
              <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest">2. Narrative Journals</h2>
              <p className="text-[11px] text-neutral-500">Tell the story. Be raw, honest, and detailed.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">What Happened? * (min 50 chars)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Give a chronological summary of what you tried, what opportunities you targeted, and the sequence of rejection..."
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">The Lowest Point *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="What did it feel like at your lowest moment? The burnout, the exhaustion..."
                    value={lowestPoint}
                    onChange={(e) => setLowestPoint(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Your Biggest Mistake *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Looking back, what strategic error did you make that contributed to the outcome?"
                    value={biggestMistake}
                    onChange={(e) => setBiggestMistake(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Reflections */}
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-900 pb-4 mb-4">
              <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest">3. Turning Points & Lessons</h2>
              <p className="text-[11px] text-neutral-500">Share the knowledge gained so others can avoid your errors.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">What Changed? *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How did you adjust your strategy? Did you pivot, learn a new framework, change your resume, or change your outlook?"
                  value={whatChanged}
                  onChange={(e) => setWhatChanged(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">What Did You Learn? *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What is the single most important lesson that this experience hammered home?"
                  value={whatLearned}
                  onChange={(e) => setWhatLearned(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Advice for Others *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="If someone is in your exact shoes right now, what practical advice do you have?"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Reflection & Present View *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How do you view this entire timeline now? Are you at peace with it?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-3 py-2 text-sm transition font-sans"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Timeline Builder */}
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-900 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest">4. Timeline Milestones</h2>
                <p className="text-[11px] text-neutral-500">Map the chronological steps. Rejections earn +10 persistence points.</p>
              </div>
              <button
                type="button"
                onClick={addTimelineEvent}
                className="flex items-center gap-1 text-[11px] font-bold bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-amber-500 px-3 py-1.5 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>
            </div>

            <div className="space-y-4">
              {timeline.map((evt, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-neutral-950 p-4 rounded-lg border border-neutral-900 relative">
                  <div className="grid md:grid-cols-12 gap-4 flex-1">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Date</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Oct 2025"
                        value={evt.date}
                        onChange={(e) => updateTimelineEvent(idx, 'date', e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Event Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rejected by Stripe (Final round)"
                        value={evt.title}
                        onChange={(e) => updateTimelineEvent(idx, 'title', e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Status Type</label>
                      <select
                        value={evt.status}
                        onChange={(e) => updateTimelineEvent(idx, 'status', e.target.value as any)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-neutral-300"
                      >
                        <option value="fail">Rejection / Failure</option>
                        <option value="success">Success / Placement</option>
                        <option value="milestone">Milestone / OA Passed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Brief Details</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Solved both coding questions, but was failed on system design communication..."
                        value={evt.description}
                        onChange={(e) => updateTimelineEvent(idx, 'description', e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {timeline.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimelineEvent(idx)}
                      className="p-1 text-neutral-600 hover:text-red-400 hover:bg-neutral-900 rounded self-start mt-4 transition"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold px-8 py-3 rounded-lg text-sm transition duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-t-black border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  Publishing Journey...
                </>
              ) : (
                <>
                  Publish Journey
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
