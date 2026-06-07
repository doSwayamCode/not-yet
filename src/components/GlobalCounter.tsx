'use client';

import React, { useEffect, useState } from 'react';

interface Metrics {
  applicationsRejected: number;
  interviewsFailed: number;
  hackathonsLost: number;
  startupsClosed: number;
  projectsAbandoned: number;
  lessonsShared: number;
  peopleHelped: number;
  storiesPublished: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) return;

    // Fast animation to end value
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const updateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out exponential
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * (end - start) + start);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    requestAnimationFrame(updateNumber);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function GlobalCounter() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/stats/counter');
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Poll every 10 seconds for real-time vibe
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  const rejectionsTotal = metrics
    ? metrics.applicationsRejected +
      metrics.interviewsFailed +
      metrics.hackathonsLost +
      metrics.startupsClosed +
      metrics.projectsAbandoned
    : 0;

  const statItems = [
    { label: 'Applications Rejected', value: metrics?.applicationsRejected || 0, color: 'text-rose-500' },
    { label: 'Interviews Failed', value: metrics?.interviewsFailed || 0, color: 'text-amber-500' },
    { label: 'Startups Closed', value: metrics?.startupsClosed || 0, color: 'text-indigo-400' },
    { label: 'Projects Abandoned', value: metrics?.projectsAbandoned || 0, color: 'text-neutral-500' },
    { label: 'Hackathons Lost', value: metrics?.hackathonsLost || 0, color: 'text-cyan-400' },
    { label: 'Lessons Shared', value: metrics?.lessonsShared || 0, color: 'text-emerald-400' },
  ];

  return (
    <div className="w-full bg-[#0F0F0F] border border-neutral-900 rounded-2xl p-6 md:p-10 glow-amber relative overflow-hidden">
      {/* HUD-style backdrop design */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative flex flex-col items-center text-center mb-8 md:mb-12">
        <div className="text-5xl md:text-7xl font-black tracking-tight text-white mb-2 font-mono">
          <AnimatedNumber value={rejectionsTotal} />
        </div>
        <div className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Rejections & Failures Shared
        </div>
        <p className="text-sm md:text-base text-neutral-400 max-w-md">
          A living tribute to every path taken, every doorway closed, and the courage to stand up again. Still Going.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 border-t border-neutral-900 pt-8">
        {statItems.map((item, index) => (
          <div key={index} className="flex flex-col p-4 rounded-xl bg-neutral-950 border border-neutral-900/60 hover:border-neutral-800 transition duration-300">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{item.label}</span>
            <span className={`text-2xl md:text-3xl font-extrabold font-mono ${item.color}`}>
              <AnimatedNumber value={item.value} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
