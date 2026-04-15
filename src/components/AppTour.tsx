import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Target, Search, Shield, Package, BookOpen, BarChart3, Crosshair, Calendar, Settings, Menu } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  category?: string;
}

const steps: TourStep[] = [
  {
    title: 'Welcome to NODE',
    description: 'NODE is your precision rifle logbook — a single place to track every piece of equipment, every load, and every shot. This tour will walk you through each module in about 2 minutes.',
    icon: <Crosshair className="w-8 h-8" style={{ color: '#f59e0b' }} />,
  },
  {
    title: 'Navigation',
    description: 'Use the hamburger menu (☰) in the top-left corner to open the sidebar. Modules are grouped by category. Your last-used module is remembered between sessions.',
    icon: <Menu className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Getting Around',
  },
  {
    title: 'Rifles',
    description: 'Log every rifle in your inventory — action, caliber, barrel, chassis, and trigger. Each rifle becomes selectable when logging range sessions, building DOPE cards, and analyzing loads.',
    icon: <Target className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Equipment',
  },
  {
    title: 'Optics & Glass',
    description: 'Track all your optics — rifle scopes, spotting scopes, binoculars, and rangefinders. Binoculars include a magnification × objective field (e.g. 10x42). For rifle scopes, you can upload a reticle photo and zoom in at any time.',
    icon: <Search className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Equipment',
  },
  {
    title: 'Accessories',
    description: 'Keep a record of your support gear — bipods, suppressors, muzzle brakes, shooting bags, slings, chronographs, and more.',
    icon: <Shield className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Equipment',
  },
  {
    title: 'Reloading Gear',
    description: 'Inventory your reloading components (bullets, powder, brass, primers) and equipment (press, dies, scale, trimmer, annealer, etc.). Lot numbers and weights are tracked per item.',
    icon: <Package className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Equipment',
  },
  {
    title: 'Torque Specs',
    description: 'Record torque specifications for every fastener on your rifles — action screws, scope rings, rail screws, and more. Specs are stored per rifle so you always have the right values at hand.',
    icon: <Settings className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Equipment',
  },
  {
    title: 'DOPE',
    description: 'Build a DOPE card per rifle in MOA or MIL. Enter elevation holds at each distance, plus windage values for four configurable wind speeds — set the mph values directly above each column. Hit Print 3×5 to generate a field-ready card sized for an index card.',
    icon: <Crosshair className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Shooting',
  },
  {
    title: 'Range Session',
    description: 'Log a shooting session with environmental conditions (temp, humidity, wind, pressure, altitude), then add groups with size, ES, MR, and velocities. Upload velocities from a CSV or Excel file — a dot plot with SD band is generated automatically.',
    icon: <Crosshair className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Shooting',
  },
  {
    title: 'Session History',
    description: 'All logged sessions are accessible under the History tab inside Range Session. Expand any session to review conditions and group data. Export all sessions to CSV at any time.',
    icon: <Calendar className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Shooting',
  },
  {
    title: 'Match Calendar',
    description: 'Schedule upcoming competitions with date, optional time, reminders, and notes. Toggle "All Day" off to set a specific time — the picker uses 15-minute increments. Events are sorted chronologically so your next match is always at the top.',
    icon: <Calendar className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Shooting',
  },
  {
    title: 'Load Recipes',
    description: 'Document your handload recipes — bullet, powder charge, case, primer, OAL, seating depth, and neck tension. Tap any card to expand it and see the full recipe. Recipes can be duplicated as a starting point for new loads.',
    icon: <BookOpen className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Load Development',
  },
  {
    title: 'Load Analysis',
    description: 'Visualize load performance across sessions. The Accuracy Node plots group size vs. charge weight. Velocity Consistency shows SD trends. The Load Performance Matrix maps accuracy vs. consistency for each load.',
    icon: <BarChart3 className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Load Development',
  },
  {
    title: 'Cleaning Log',
    description: 'Track every cleaning session per rifle — date, round count since last clean, products used, and notes. Helps you identify patterns between cleaning intervals and accuracy.',
    icon: <Settings className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'Maintenance',
  },
  {
    title: 'Data Management',
    description: 'Export a full JSON backup of all your data at any time, and restore it on any device. Find this under Data Management in the System section of the menu.',
    icon: <Settings className="w-8 h-8" style={{ color: '#f59e0b' }} />,
    category: 'System',
  },
  {
    title: "You're ready",
    description: "That's everything. Start by adding your rifles and gear under Equipment, then build out your load recipes and DOPE cards. Happy shooting.",
    icon: <Crosshair className="w-8 h-8" style={{ color: '#f59e0b' }} />,
  },
];

interface AppTourProps {
  onClose: () => void;
}

export function AppTour({ onClose }: AppTourProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const go = (dir: 1 | -1) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + dir);
      setAnimating(false);
    }, 180);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !isLast) go(1);
      if (e.key === 'ArrowLeft' && !isFirst) go(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, isFirst, isLast]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border"
        style={{
          backgroundColor: '#111111',
          borderColor: '#2a2a2a',
          boxShadow: '0 0 60px rgba(245,158,11,0.08)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar */}
        <div className="px-8 pt-8">
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-0.5 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= step ? '#f59e0b' : '#2a2a2a' }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="px-8 pb-8 transition-opacity duration-180"
          style={{ opacity: animating ? 0 : 1 }}
        >
          {/* Category badge */}
          {current.category && (
            <div className="mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}
              >
                {current.category}
              </span>
            </div>
          )}

          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              {current.icon}
            </div>
            <div>
              <h2
                className="text-xl font-bold tracking-wide"
                style={{ color: 'white', fontFamily: 'Oswald, sans-serif' }}
              >
                {current.title}
              </h2>
              <p className="text-xs mt-1" style={{ color: '#4a4a4a' }}>
                {step + 1} of {steps.length}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#94a3b8' }}>
            {current.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => go(-1)}
              disabled={isFirst}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all disabled:opacity-20"
              style={{ color: '#94a3b8' }}
              onMouseEnter={e => !isFirst && ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={() => go(-step as any)}  // jump to start via dots if needed
              className="flex gap-1.5 items-center"
            >
              {steps.map((_, i) => (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); if (!animating) { setAnimating(true); setTimeout(() => { setStep(i); setAnimating(false); }, 180); } }}
                  className="rounded-full cursor-pointer transition-all duration-200"
                  style={{
                    width: i === step ? '16px' : '6px',
                    height: '6px',
                    backgroundColor: i === step ? '#f59e0b' : '#2a2a2a',
                  }}
                />
              ))}
            </button>

            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#f59e0b', color: '#0a0a0a' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#d97706')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#f59e0b')}
              >
                Get started
              </button>
            ) : (
              <button
                onClick={() => go(1)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all"
                style={{ color: '#f59e0b' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#f59e0b')}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
