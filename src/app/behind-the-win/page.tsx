'use client';

import React, { useState, useRef } from 'react';
import { Plus, Trash, Image, Award, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface PrecedingFailure {
  date: string;
  title: string;
}

export default function BehindTheWin() {
  const [successTitle, setSuccessTitle] = useState('Placed as Software Engineer at Google');
  const [successDate, setSuccessDate] = useState('June 2026');
  
  const [failures, setFailures] = useState<PrecedingFailure[]>([
    { date: 'Oct 2025', title: 'Rejected by Amazon (OA Failed)' },
    { date: 'Dec 2025', title: 'Failed Meta Phone Interview' },
    { date: 'Feb 2026', title: 'Rejected by Stripe (Final Round)' },
    { date: 'April 2026', title: 'Lost local hackathon (3rd place)' },
  ]);

  const addFailure = () => {
    setFailures([...failures, { date: '', title: '' }]);
  };

  const updateFailure = (index: number, field: keyof PrecedingFailure, value: string) => {
    const updated = [...failures];
    updated[index] = { ...updated[index], [field]: value };
    setFailures(updated);
  };

  const removeFailure = (index: number) => {
    if (failures.length === 1) return;
    setFailures(failures.filter((_, idx) => idx !== index));
  };

  // Export Infographic to PNG
  const handleExport = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions
    canvas.width = 1080;
    canvas.height = 1350; // Instagram portrait aspect ratio 4:5

    // Draw background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid background
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Gradient glow in the background
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height - 200, 10, canvas.width / 2, canvas.height, 600);
    grad.addColorStop(0, 'rgba(46, 204, 113, 0.1)'); // green glow near success
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Brand Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('notYET', 80, 100);

    ctx.fillStyle = '#A3A3A3';
    ctx.font = '18px monospace';
    ctx.fillText('THE PRECEDING PATHWAY', 80, 140);

    // Core Title Card
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '22px sans-serif';
    ctx.fillText('Everyone celebrates Chapter 20. We collect Chapters 1-19.', 80, 210);

    // Timeline Path Line
    const startY = 320;
    const spacingY = 180;
    const timelineX = 150;
    const totalEvents = failures.length + 1; // failures + 1 success
    const endY = startY + (totalEvents - 1) * spacingY;

    // Draw path connecting line
    ctx.strokeStyle = '#1C1C1C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(timelineX, startY);
    ctx.lineTo(timelineX, endY);
    ctx.stroke();

    // Draw failures nodes
    failures.forEach((fail, idx) => {
      const currentY = startY + idx * spacingY;

      // Draw red node circle
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(timelineX, currentY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(timelineX, currentY, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Draw date text
      ctx.fillStyle = '#A3A3A3';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(fail.date.toUpperCase() || 'TIMELINE STEP', timelineX + 50, currentY - 10);

      // Draw event text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(fail.title || 'Attempt description', timelineX + 50, currentY + 25);
    });

    // Draw Success Node (last node)
    const successY = startY + failures.length * spacingY;

    // Draw green node circle
    ctx.fillStyle = '#2ECC71';
    ctx.beginPath();
    ctx.arc(timelineX, successY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow ring
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.2)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(timelineX, successY, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Draw date text
    ctx.fillStyle = '#2ECC71';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`${successDate.toUpperCase()} (THE WIN)`, timelineX + 50, successY - 12);

    // Draw Success Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'black 34px sans-serif';
    ctx.fillText(successTitle || 'Chapter 20 Success', timelineX + 50, successY + 28);

    // Footer copyright or watermark
    ctx.fillStyle = '#333333';
    ctx.font = '16px monospace';
    ctx.fillText('GENERATED AT NOTYET.APP — EMBRACE PERSISTENCE', 80, canvas.height - 80);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `notyet-path-to-win.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">BEHIND THE WIN</h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            Connect success to rejections. Export a custom high-quality infographic to share your true timeline.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Controls Form */}
          <div className="lg:col-span-5 bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 md:p-6 space-y-6 self-start">
            
            <div className="border-b border-neutral-900 pb-4">
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Chapter 20: The Win
              </h2>
              <p className="text-[10px] text-neutral-500">Add the final successful outcome to cap off your timeline.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Success Title</label>
                <input
                  type="text"
                  value={successTitle}
                  onChange={(e) => setSuccessTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded px-3 py-2 text-xs transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Success Date</label>
                <input
                  type="text"
                  value={successDate}
                  onChange={(e) => setSuccessDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded px-3 py-2 text-xs transition"
                />
              </div>
            </div>

            <div className="border-b border-neutral-900 pb-4 pt-2 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-rose-500 uppercase tracking-widest">Chapters 1-19: Rejections</h2>
                <p className="text-[10px] text-neutral-500 font-sans">Add preceding failures chronologically.</p>
              </div>
              <button
                onClick={addFailure}
                className="flex items-center gap-1 text-[10px] font-bold bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-rose-500 px-2.5 py-1.5 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rejection
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {failures.map((fail, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-neutral-950 p-3 rounded-lg border border-neutral-900">
                  <div className="grid grid-cols-12 gap-2 flex-1">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Oct 2025"
                        value={fail.date}
                        onChange={(e) => updateFailure(idx, 'date', e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-rose-500 focus:outline-none rounded px-2.5 py-1.5 text-[11px] text-white"
                      />
                    </div>
                    <div className="col-span-8">
                      <input
                        type="text"
                        placeholder="e.g. Rejected by Stripe (Final round)"
                        value={fail.title}
                        onChange={(e) => updateFailure(idx, 'title', e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-neutral-800 focus:border-rose-500 focus:outline-none rounded px-2.5 py-1.5 text-[11px] text-white"
                      />
                    </div>
                  </div>

                  {failures.length > 1 && (
                    <button
                      onClick={() => removeFailure(idx)}
                      className="p-1 text-neutral-600 hover:text-red-400 hover:bg-neutral-900 rounded self-center transition"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-lg text-xs transition duration-300 flex items-center justify-center gap-1.5"
            >
              <Image className="w-4 h-4" />
              Export Path Infographic (PNG)
            </button>
          </div>

          {/* Right Live Preview Card */}
          <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-8 flex flex-col justify-between aspect-[4/5] max-w-[500px] lg:max-w-none mx-auto w-full relative overflow-hidden shadow-2xl">
            {/* Ambient Background glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Infographic Top Headers */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-neutral-900 pb-4">
                  <div>
                    <span className="text-lg font-black tracking-wider text-white">not<span className="text-amber-500">YET</span></span>
                    <span className="text-[9px] block text-neutral-500 uppercase tracking-widest font-mono mt-0.5">THE PRECEDING PATHWAY</span>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    LIVE PREVIEW
                  </span>
                </div>
                
                <h3 className="text-xs font-bold text-neutral-400 italic mb-8">
                  "Everyone celebrates Chapter 20. We collect Chapters 1-19."
                </h3>
              </div>

              {/* Center Timeline Visual */}
              <div className="flex-1 relative flex flex-col justify-center pl-6 border-l border-neutral-900 my-4 ml-6 space-y-8 py-2">
                {failures.map((fail, idx) => (
                  <div key={idx} className="relative pl-4">
                    {/* Node indicator dot */}
                    <span className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-neutral-950 bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
                    <span className="block text-[9px] font-mono text-neutral-500 uppercase">{fail.date || 'DATE'}</span>
                    <span className="text-xs font-bold text-neutral-200">{fail.title || 'Rejection / Attempt Description'}</span>
                  </div>
                ))}

                {/* Final Success node */}
                <div className="relative pl-4 pt-1">
                  <span className="absolute -left-[32px] top-2 w-4.5 h-4.5 rounded-full border-2 border-neutral-950 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-neutral-950 stroke-[3]" />
                  </span>
                  <span className="block text-[10px] font-mono text-emerald-500 font-extrabold uppercase">{successDate || 'DATE'} (WIN)</span>
                  <span className="text-sm font-extrabold text-white">{successTitle || 'Chapter 20 Outcome'}</span>
                </div>
              </div>

              {/* Watermark Footer */}
              <div className="border-t border-neutral-900 pt-4 flex items-center justify-between text-[8px] text-neutral-600 font-mono uppercase tracking-widest">
                <span>generated at notyet.app</span>
                <span>embrace persistence</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
