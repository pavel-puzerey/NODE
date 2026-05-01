import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Legend } from 'recharts';
import { Target, Activity, BarChart3, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { RangeSession, Rifle, Load } from '../types';

interface LoadAnalysisProps {
  sessions: RangeSession[];
  rifles: Rifle[];
  loads: Load[];
  ammo?: any[];
}

const PLOT_OPTIONS = [
  { id: 'velocity_trend',  label: 'Velocity Trend' },
  { id: 'velocity_trace',  label: 'Shot Velocity Trace' },
  { id: 'perf_matrix',     label: 'Load Performance Matrix' },
  { id: 'accuracy_node',   label: 'Accuracy Node' },
  { id: 'vel_consistency', label: 'Velocity Consistency' },
];

export function LoadAnalysis({ sessions, rifles, loads, ammo = [] }: LoadAnalysisProps) {
  const [selectedRifleId, setSelectedRifleId] = useState<string>('');
  const [excludedSessionIds, setExcludedSessionIds] = useState<string[]>([]);
  const [excludedGroupIds, setExcludedGroupIds] = useState<string[]>([]);
  const [expandedFilterDateKey, setExpandedFilterDateKey] = useState<string | null>(null);
  const [selectedTraceGroups, setSelectedTraceGroups] = useState<string[]>([]);
  const [visiblePlots, setVisiblePlots] = useState<Set<string>>(new Set());
  const [plotMenuOpen, setPlotMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [velThreshold, setVelThreshold] = useState('');
  const [groupThreshold, setGroupThreshold] = useState('');
  const [accuracyUnit, setAccuracyUnit] = useState<'in' | 'moa'>('in');
  const [matrixUnit, setMatrixUnit] = useState<'in' | 'moa'>('in');
  const [matrixYMin, setMatrixYMin] = useState('');
  const [matrixYMax, setMatrixYMax] = useState('');
  const [matrixYStep, setMatrixYStep] = useState('');
  const [yMin, setYMin] = useState('');
  const [yMax, setYMax] = useState('');
  const [yStep, setYStep] = useState('');

  const getSessionMeta = (s: RangeSession) => {
    const load = loads.find(l => l.id === s.loadId);
    if (load) return { label: `${load.charge}gr`, key: load.id, charge: load.charge };
    const fa = ammo.find((a: any) => a.id === (s as any).ammoUsageId);
    const lbl = fa ? (`${(fa as any).brand || ''} ${(fa as any).name || ''}`.trim() || 'Factory') : 'Factory';
    return { label: lbl, key: lbl, charge: 0 };
  };

  const rifleStats = useMemo(() => {
    if (!selectedRifleId) return null;
    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const allGroups = rifleSessions.flatMap(s => s.groups.filter(g => !excludedGroupIds.includes(g.id)));
    if (allGroups.length === 0) return null;
    const totalGroups = allGroups.length;
    const validGroups = allGroups.filter(g => g.groupSize > 0);
    const bestGroupSize = validGroups.length > 0 ? Math.min(...validGroups.map(g => g.groupSize)) : 0;
    const totalVelSd = allGroups.reduce((sum, g) => sum + g.velocitySd, 0);
    const avgVelSd = totalVelSd / allGroups.length;
    return { totalGroups, bestGroupSize, avgVelSd };
  }, [selectedRifleId, sessions, excludedSessionIds, excludedGroupIds]);

  const chartData = useMemo(() => {
    if (!selectedRifleId) return [];
    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const loadMap = new Map<string, any>();
    rifleSessions.forEach(session => {
      const meta = getSessionMeta(session);
      if (!loadMap.has(meta.key)) loadMap.set(meta.key, { charge: meta.charge, totalGroupSize: 0, groupCount: 0, totalVelSd: 0, velCount: 0, loadName: meta.label } as any);
      const data = loadMap.get(meta.key)!;
      session.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(group => {
        if (group.groupSize > 0) { data.totalGroupSize += group.groupSize; data.groupCount++; }
        const vels = (group as any).velocities as number[] | undefined;
        const sdToUse = group.velocitySd > 0 ? group.velocitySd : (() => {
          if (!vels || vels.length < 2) return 0;
          const mean = vels.reduce((a: number, b: number) => a + b, 0) / vels.length;
          return Math.sqrt(vels.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (vels.length - 1));
        })();
        if (sdToUse > 0) { data.totalVelSd += sdToUse; data.velCount++; }
      });
    });
    return Array.from(loadMap.values())
      .map((item: any) => ({ charge: item.charge, label: item.loadName, avgGroupSize: item.groupCount > 0 ? item.totalGroupSize / item.groupCount : 0, avgVelSd: item.velCount > 0 ? item.totalVelSd / item.velCount : 0, shots: item.groupCount || item.velCount }))
      .filter((item: any) => item.avgVelSd > 0 || item.avgGroupSize > 0)
      .sort((a, b) => a.charge - b.charge);
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  const scatterData = useMemo(() => {
    if (!selectedRifleId) return [];
    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const loadMap = new Map<string, any>();
    rifleSessions.forEach(session => {
      const meta = getSessionMeta(session);
      if (!loadMap.has(meta.key)) loadMap.set(meta.key, { totalGroupSize: 0, groupCount: 0, totalVelSd: 0, velCount: 0, charge: meta.charge, label: meta.label } as any);
      const data = loadMap.get(meta.key)!;
      session.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(group => {
        if (group.groupSize > 0) { data.totalGroupSize += group.groupSize; data.groupCount++; }
        const vels = (group as any).velocities as number[] | undefined;
        const sdToUse = group.velocitySd > 0 ? group.velocitySd : (() => {
          if (!vels || vels.length < 2) return 0;
          const mean = vels.reduce((a: number, b: number) => a + b, 0) / vels.length;
          return Math.sqrt(vels.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (vels.length - 1));
        })();
        if (sdToUse > 0) { data.totalVelSd += sdToUse; data.velCount++; }
      });
    });
    return Array.from(loadMap.values())
      .map((item: any) => ({ name: item.label || `${item.charge}gr`, x: item.velCount > 0 ? Number((item.totalVelSd / item.velCount).toFixed(2)) : 0, y: item.groupCount > 0 ? Number((item.totalGroupSize / item.groupCount).toFixed(4)) : 0, z: item.groupCount }))
      .filter((item: any) => item.z > 0);
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  const velTrendData = useMemo(() => {
    if (!selectedRifleId) return [];
    const points: { charge: number; chargeLabel: string; velocity: number; date: string; temp: number | null }[] = [];
    sessions
      .filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id))
      .forEach(s => {
        const meta = getSessionMeta(s);
        const dateStr = s.sessionDate.slice(0, 10);
        const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const temp = s.conditions?.temperature ?? null;
        s.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(g => {
          const vels = (g as any).velocities as number[] | undefined;
          if (vels && vels.length > 0) vels.forEach(v => points.push({ charge: meta.charge, chargeLabel: meta.label, velocity: v, date: dateLabel, temp }));
        });
      });
    return points.sort((a, b) => a.charge - b.charge);
  }, [selectedRifleId, sessions, loads, ammo, excludedSessionIds, excludedGroupIds]);

  const velTrendMeans = useMemo(() => {
    if (velTrendData.length === 0) return [];
    const chargeMap = new Map<number, { vels: number[]; label: string }>();
    velTrendData.forEach((d: any) => {
      if (!chargeMap.has(d.charge)) chargeMap.set(d.charge, { vels: [], label: d.chargeLabel || String(d.charge) });
      chargeMap.get(d.charge)!.vels.push(d.velocity);
    });
    return Array.from(chargeMap.entries())
      .map(([charge, { vels, label }]) => ({ charge, chargeLabel: label, velocity: Number((vels.reduce((a, b) => a + b, 0) / vels.length).toFixed(1)) }))
      .sort((a, b) => a.charge - b.charge);
  }, [velTrendData]);

  const velTrendXTicks = useMemo(() => {
    if (velTrendData.length === 0) return [];
    const seen = new Set<number>();
    const ticks: number[] = [];
    [...velTrendData].sort((a: any, b: any) => a.charge - b.charge)
      .forEach((d: any) => { if (!seen.has(d.charge)) { seen.add(d.charge); ticks.push(d.charge); } });
    return ticks;
  }, [velTrendData]);

  const chargeLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    velTrendData.forEach((d: any) => { if (!map.has(d.charge)) map.set(d.charge, d.chargeLabel); });
    return map;
  }, [velTrendData]);

  const velTrendYAxis = useMemo(() => {
    if (velTrendData.length === 0) return { domain: [0, 3500] as [number, number], ticks: undefined };
    const velocities = velTrendData.map((d: any) => d.velocity as number).filter(Boolean);
    if (velocities.length === 0) return { domain: [0, 3500] as [number, number], ticks: undefined };
    const min = Math.min(...velocities), max = Math.max(...velocities);
    const lo = Math.floor((min - 50) / 10) * 10, hi = Math.ceil((max + 50) / 10) * 10;
    const range = hi - lo;
    const rawInterval = range / 6;
    const interval = rawInterval <= 10 ? 10 : rawInterval <= 20 ? 20 : rawInterval <= 25 ? 25 : rawInterval <= 50 ? 50 : 100;
    const ticks: number[] = [];
    for (let t = Math.ceil(lo / interval) * interval; t <= hi; t += interval) ticks.push(t);
    return { domain: [lo, hi] as [number, number], ticks };
  }, [velTrendData]);

  const velTraceData = useMemo(() => {
    if (!selectedRifleId) return [];
    const groups: { groupKey: string; label: string; points: { shot: number; velocity: number; time: string }[] }[] = [];
    sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id)).forEach(s => {
      const load = loads.find(l => l.id === s.loadId);
      const dateLabel = new Date(s.sessionDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      s.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(g => {
        const vels = (g as any).velocities as number[] | undefined;
        const times = (g as any).velocityTimes as string[] | undefined;
        if (!vels || vels.length === 0) return;
        groups.push({ groupKey: g.id, label: `${dateLabel} · G${g.groupId}${load ? ` · ${load.charge}gr` : ''}`, points: vels.map((v, i) => ({ shot: i + 1, velocity: v, time: times?.[i] || '' })) });
      });
    });
    return groups;
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  useEffect(() => {
    if (velTraceData.length > 0 && selectedTraceGroups.length === 0) {
      setSelectedTraceGroups(velTraceData.map((g: any) => g.groupKey));
    }
  }, [velTraceData]);

  const selectedRifle = rifles.find(r => r.id === selectedRifleId);

  const uniformTicks = (vals: number[], count = 5) => {
    if (vals.length === 0) return { domain: [0, 1] as [number, number], ticks: [] as number[] };
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const rawStep = range / (count - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let t = lo; t <= hi + step * 0.001; t = Math.round((t + step) * 10000) / 10000) ticks.push(t);
    return { domain: [lo, hi] as [number, number], ticks };
  };

  // Convert group size inches → MOA using session distances
  const inchesToMoa = (inches: number, yards: number) => yards > 0 ? inches / (yards / 100 * 1.0472) : null;

  // Average distance across sessions for the selected rifle
  const avgDistanceYards = useMemo(() => {
    if (!selectedRifleId) return 100;
    const dists: number[] = [];
    sessions.filter(s => s.rifleId === selectedRifleId).forEach(s => {
      s.groups.forEach(g => {
        const d = parseFloat((g as any).distance || '');
        if (!isNaN(d) && d > 0) dists.push(d);
      });
    });
    return dists.length > 0 ? dists.reduce((a, b) => a + b, 0) / dists.length : 100;
  }, [selectedRifleId, sessions]);

  const customYAxis = (() => {
    const min = parseFloat(yMin), max = parseFloat(yMax), step = parseFloat(yStep);
    if (!isNaN(min) && !isNaN(max) && !isNaN(step) && step > 0 && max > min) {
      const ticks: number[] = [];
      for (let t = min; t <= max + 0.001; t += step) ticks.push(Math.round(t * 100) / 100);
      return { domain: [min, max] as [number, number], ticks };
    }
    return null;
  })();

  // ── FIX 1: velocity trend x-axis domain — half-tick padding on each side ──
  const velTrendXDomain = useMemo(() => {
    if (velTrendXTicks.length === 0) return ['auto', 'auto'] as any;
    if (velTrendXTicks.length === 1) {
      const v = velTrendXTicks[0];
      return [v - 0.5, v + 0.5];
    }
    const gap = velTrendXTicks[1] - velTrendXTicks[0];
    return [velTrendXTicks[0] - gap / 2, velTrendXTicks[velTrendXTicks.length - 1] + gap / 2];
  }, [velTrendXTicks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Load Analysis</h2></div>
      </div>

      {/* Rifle Selector */}
      <Card className="bg-slate-900 border-slate-800 card-tactical">
        <CardHeader>
          <CardTitle className="text-white">Select Rifle</CardTitle>
          <CardDescription className="text-slate-400">Choose a rifle to view load performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRifleId} onValueChange={(id: string) => { setSelectedRifleId(id); setExcludedSessionIds([]); setExcludedGroupIds([]); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue placeholder="Select a rifle..." /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {rifles.map(rifle => (<SelectItem key={rifle.id} value={rifle.id} className="text-white">{rifle.caliber} - {rifle.action}</SelectItem>))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRifleId && (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Filter Sessions & Groups</CardTitle>
              <div className="flex gap-3">
                <button onClick={() => { setExcludedSessionIds([]); setExcludedGroupIds([]); }} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Select all</button>
                <button onClick={() => { const rs = sessions.filter(s => s.rifleId === selectedRifleId); setExcludedSessionIds(rs.map(s => s.id)); setExcludedGroupIds(rs.flatMap(s => s.groups.map(g => g.id))); }} className="text-xs text-slate-500 hover:text-white transition-colors">Clear all</button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {(() => {
              const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
              const grouped: Record<string, typeof rifleSessions> = {};
              rifleSessions.forEach(s => { const dk = s.sessionDate.slice(0, 10); if (!grouped[dk]) grouped[dk] = []; grouped[dk].push(s); });
              return Object.entries(grouped).map(([dateKey, dateSessions]) => {
                const dateLabel = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isExpanded = expandedFilterDateKey === dateKey;
                const totalGroups = dateSessions.reduce((sum, s) => sum + s.groups.length, 0);
                const allSessionIds = dateSessions.map(s => s.id);
                const allGroupIds = dateSessions.flatMap(s => s.groups.map(g => g.id));
                const anyOn = allSessionIds.some(id => !excludedSessionIds.includes(id));
                return (
                  <div key={dateKey} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <button onClick={() => { if (anyOn) { setExcludedSessionIds(prev => [...prev, ...allSessionIds.filter(id => !prev.includes(id))]); setExcludedGroupIds(prev => [...prev, ...allGroupIds.filter(id => !prev.includes(id))]); } else { setExcludedSessionIds(prev => prev.filter(id => !allSessionIds.includes(id))); setExcludedGroupIds(prev => prev.filter(id => !allGroupIds.includes(id))); } }} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm border flex-shrink-0 transition-colors ${anyOn ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`} />
                      </button>
                      <button onClick={() => setExpandedFilterDateKey(isExpanded ? null : dateKey)} className="flex items-center gap-2 flex-1 text-left px-2">
                        <span className="text-xs font-semibold text-white">{dateLabel}</span>
                        <span className="text-xs text-slate-500">{dateSessions.length} {dateSessions.length === 1 ? 'session' : 'sessions'} · {totalGroups} groups</span>
                      </button>
                      <button onClick={() => setExpandedFilterDateKey(isExpanded ? null : dateKey)} className="text-slate-500">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-800 px-3 py-2 space-y-2">
                        {dateSessions.map(session => {
                          const load = loads.find(l => l.id === session.loadId);
                          const sessionOn = !excludedSessionIds.includes(session.id);
                          return (
                            <div key={session.id}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <button onClick={() => { const gids = session.groups.map(g => g.id); if (sessionOn) { setExcludedSessionIds(prev => [...prev, session.id]); setExcludedGroupIds(prev => [...prev, ...gids.filter(id => !prev.includes(id))]); } else { setExcludedSessionIds(prev => prev.filter(id => id !== session.id)); setExcludedGroupIds(prev => prev.filter(id => !gids.includes(id))); } }} className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${sessionOn ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`} />
                                </button>
                                {load ? (
                                  <span className="text-xs text-slate-400">{load.charge}gr {load.bulletId ? `· ${load.bulletId}` : ''}{(load as any).weight ? ` · ${(load as any).weight}gr bullet` : ''}</span>
                                ) : (() => {
                                  const fa = ammo.find((a: any) => a.id === (session as any).ammoUsageId);
                                  const lbl = fa ? `${(fa as any).brand || ''} ${(fa as any).name || ''} ${(fa as any).caliber || ''} ${(fa as any).weight ? `· ${(fa as any).weight}gr` : ''}`.trim() : 'Factory Ammo';
                                  return <span className="text-xs text-slate-400">{lbl}</span>;
                                })()}
                              </div>
                              <div className="flex flex-wrap gap-1.5 pl-4">
                                {session.groups.map(group => {
                                  const groupOn = !excludedGroupIds.includes(group.id);
                                  return (
                                    <button key={group.id} onClick={() => { if (groupOn) setExcludedGroupIds(prev => [...prev, group.id]); else setExcludedGroupIds(prev => prev.filter(id => id !== group.id)); }} className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors ${groupOn ? 'border-amber-600 text-amber-400 bg-amber-900/20' : 'border-slate-700 text-slate-600'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${groupOn ? 'bg-amber-400' : 'bg-slate-700'}`} />
                                      Group #{group.groupId}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      )}

      {selectedRifleId && rifleStats ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Groups</CardTitle>
                <Target className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="stat-readout">{rifleStats.totalGroups}</div>
                <p className="text-xs text-slate-500 mt-1">Groups logged for this rifle</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Best Group Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-readout">{rifleStats.bestGroupSize > 0 ? `${rifleStats.bestGroupSize.toFixed(4)}"` : '--'}</div>
                <p className="text-xs text-slate-500 mt-1">Smallest group recorded</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Velocity SD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-readout">{rifleStats.avgVelSd > 0 ? `${rifleStats.avgVelSd.toFixed(1)}` : '--'}</div>
                <p className="text-xs text-slate-500 mt-1">Average standard deviation</p>
              </CardContent>
            </Card>
          </div>

          {/* Plot selector */}
          <div className="relative">
            <button onClick={() => { setPlotMenuOpen((p: boolean) => !p); setGroupMenuOpen(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
              <span>Show Plots</span>
              {visiblePlots.size > 0 && <span className="bg-amber-600 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{visiblePlots.size}</span>}
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>
            {plotMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 rounded-lg py-1 min-w-[220px]" style={{ backgroundColor: "#0d0d0d", border: "1px solid #334155", boxShadow: "0 8px 32px rgba(0,0,0,0.9)" }}>
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800 mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Select plots</span>
                  <div className="flex gap-2">
                    <button onClick={() => setVisiblePlots(new Set(PLOT_OPTIONS.map(p => p.id)))} className="text-xs text-amber-400 hover:text-amber-300">All</button>
                    <button onClick={() => setVisiblePlots(new Set())} className="text-xs text-slate-500 hover:text-slate-300">None</button>
                  </div>
                </div>
                {PLOT_OPTIONS.map(opt => {
                  const on = visiblePlots.has(opt.id);
                  return (
                    <button key={opt.id} onClick={() => setVisiblePlots(prev => { const n = new Set(prev); if (n.has(opt.id)) n.delete(opt.id); else n.add(opt.id); return n; })} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left">
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>{on && <span className="text-slate-900 text-[10px] font-black">✓</span>}</div>
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {visiblePlots.size === 0 && <p className="text-xs text-slate-600 mt-2">Select plots above to visualize your data</p>}
          </div>

          {/* ── Velocity Trend ── */}
          {visiblePlots.has('velocity_trend') && (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-white text-base font-semibold">Velocity Trend</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Individual shot velocities per charge</CardDescription>
            </CardHeader>
            <CardContent className="pb-4" style={{ paddingLeft: "8%", paddingRight: "8%" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs text-slate-500 mr-1 whitespace-nowrap">Y:</span>
                <input type="number" value={yMin} onChange={e => setYMin(e.target.value)} placeholder="Min" className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                <span className="text-xs text-slate-600">to</span>
                <input type="number" value={yMax} onChange={e => setYMax(e.target.value)} placeholder="Max" className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                <span className="text-xs text-slate-600">step</span>
                <input type="number" value={yStep} onChange={e => setYStep(e.target.value)} placeholder="Step" className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                {(yMin || yMax || yStep) && (
                  <button onClick={() => { setYMin(''); setYMax(''); setYStep(''); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-0.5 border border-slate-700 rounded ml-1">Reset</button>
                )}
              </div>
              {velTrendData.length === 0 ? (
                <div style={{ height: 250 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No velocity data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Upload a velocity file in Range Session</p>
                </div>
              ) : (
                <div style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 80, bottom: 40, left: 60 }}>
                      <CartesianGrid vertical={false} horizontal={false} />
                      {(customYAxis ? customYAxis.ticks : (velTrendYAxis.ticks || [])).map((t: number) => (
                        <ReferenceLine key={t} y={t} stroke="#334155" strokeWidth={1} />
                      ))}
                      <XAxis type="number" dataKey="charge" stroke="#94a3b8" fontSize={11}
                        axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                        tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                        ticks={velTrendXTicks}
                        domain={velTrendXDomain}
                        height={65}
                        tick={({ x, y, payload }: any) => {
                          const raw = chargeLabelMap.get(payload.value) || `${payload.value}`;
                          const label = raw.toString().replace(/gr$/i, '').trim();
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={8} y={0} dy={8} transform="rotate(0)" textAnchor="end" fill="#94a3b8" fontSize={11}>{label}</text>
                            </g>
                          );
                        }}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: 10, fill: '#94a3b8', fontSize: 16 }}
                      />
                      <YAxis type="number" dataKey="velocity" stroke="#94a3b8" fontSize={11}
                        tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                        axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                        domain={customYAxis ? customYAxis.domain : velTrendYAxis.domain}
                        ticks={customYAxis ? customYAxis.ticks : velTrendYAxis.ticks}
                        width={52}
                        label={{ value: 'Velocity (fps)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip cursor={false} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        content={({ payload }: any) => {
                          if (!payload || payload.length === 0) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                              <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 2 }}>{d?.chargeLabel}{d?.date ? ` · ${d?.date}` : ''}</p>
                              {d?.temp != null && d.temp !== 0 && <p style={{ color: '#94a3b8', marginBottom: 2 }}>Temp: {d.temp}°F</p>}
                              <p style={{ color: d?.date ? '#d97706' : '#3b82f6', fontWeight: 600 }}>{d?.velocity} fps{!d?.date ? ' (mean)' : ''}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={velTrendData} fill="#d97706" opacity={0.7} r={4} />
                      <Scatter data={velTrendMeans} fill="#3b82f6" r={6} line={{ stroke: '#3b82f6', strokeWidth: 2 }} lineType="joint" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex gap-6 justify-center mt-2 text-xs text-slate-500">
                <span><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1 align-middle opacity-70"></span>Individual shots</span>
                <span><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1 align-middle"></span>Group mean</span>
              </div>
            </CardContent>
          </Card>
          )}

          {/* ── Shot Velocity Trace ── */}
          {visiblePlots.has('velocity_trace') && (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-white text-base font-semibold">Shot Velocity Trace</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Velocity per shot within a group</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {velTraceData.length === 0 ? (
                <div style={{ height: 280 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No velocity trace data</p>
                  <p className="text-slate-600 text-xs mt-1">Upload a velocity file in Range Session</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-4">
                    <button onClick={() => { setGroupMenuOpen((p: boolean) => !p); setPlotMenuOpen(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
                      <span>Show Groups</span>
                      {selectedTraceGroups.length > 0 && <span className="bg-amber-600 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedTraceGroups.length}</span>}
                      <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                    {groupMenuOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 rounded-lg py-1 min-w-[240px]" style={{ backgroundColor: "#0d0d0d", border: "1px solid #334155", boxShadow: "0 8px 32px rgba(0,0,0,0.9)" }}>
                        <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800 mb-1">
                          <span className="text-xs text-slate-500 uppercase tracking-widest">Select groups</span>
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedTraceGroups(velTraceData.map((g: any) => g.groupKey))} className="text-xs text-amber-400 hover:text-amber-300">All</button>
                            <button onClick={() => setSelectedTraceGroups([])} className="text-xs text-slate-500 hover:text-slate-300">None</button>
                          </div>
                        </div>
                        {velTraceData.map((g: any) => {
                          const on = selectedTraceGroups.includes(g.groupKey);
                          return (
                            <button key={g.groupKey} onClick={() => setSelectedTraceGroups((prev: string[]) => { const n=[...prev]; const i=n.indexOf(g.groupKey); if(i>=0) n.splice(i,1); else n.push(g.groupKey); return n; })} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left">
                              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>{on && <span className="text-slate-900 text-[10px] font-black">✓</span>}</div>
                              <span className="text-sm text-slate-300">{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, margin: '0 auto', maxWidth: 720 }}>
                    <div style={{ flex: 1, minWidth: 0, height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 10, right: 10, bottom: 40, left: 60 }}>
                          <CartesianGrid vertical={false} stroke="#334155" strokeWidth={1} />
                          <XAxis type="number" dataKey="shot" stroke="#94a3b8" fontSize={11}
                            axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                            tick={({ x, y, payload }: any) => {
                              const val = payload.value;
                              const isLabeled = val % 2 === 0 && val > 0;
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <line x1={0} y1={0} x2={0} y2={isLabeled ? 4 : 3} stroke="#475569" strokeWidth={1} />
                                  {isLabeled && <text x={0} y={12} textAnchor="middle" fill="#94a3b8" fontSize={11}>{val}</text>}
                                </g>
                              );
                            }}
                            ticks={(() => { const maxShot = Math.max(...velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.shot)), 1); return Array.from({ length: maxShot }, (_, i) => i + 1); })()}
                            domain={(() => { const maxShot = Math.max(...velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.shot)), 1); return [0, maxShot + 1]; })()}
                            label={{ value: 'Shot #', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                          />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={{ stroke: "#334155", strokeWidth: 1 }} axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                            domain={(() => {
                              const allVels = velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.velocity));
                              if (allVels.length === 0) return ['auto', 'auto'];
                              const mn = Math.min(...allVels), mx = Math.max(...allVels);
                              const step = mx - mn <= 100 ? 20 : 25;
                              return [Math.floor(mn / step) * step - step, Math.ceil(mx / step) * step + step];
                            })()}
                            ticks={(() => {
                              const allVels = velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.velocity));
                              if (allVels.length === 0) return [];
                              const mn = Math.min(...allVels), mx = Math.max(...allVels);
                              const step = mx - mn <= 100 ? 20 : 25;
                              const lo = Math.floor(mn / step) * step - step;
                              const hi = Math.ceil(mx / step) * step + step;
                              const ticks = [];
                              for (let t = lo; t <= hi; t += step) ticks.push(t);
                              return ticks;
                            })()}
                            width={52}
                            label={{ value: 'Velocity (fps)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip active={false} content={() => null} />
                          {(() => {
                            const COLORS = ['#d97706','#3b82f6','#22c55e','#a855f7','#ef4444','#06b6d4','#f97316','#84cc16'];
                            return velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).map((g: any, i: number) => (
                              <Line key={g.groupKey} data={g.points} type="linear" dataKey="velocity" name={g.label}
                                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                                dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                                activeDot={false}
                                isAnimationActive={false}
                                connectNulls />
                            ));
                          })()}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flexShrink: 0, paddingTop: 10, maxWidth: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).map((g: any, i: number) => {
                        const COLORS = ['#d97706','#3b82f6','#22c55e','#a855f7','#ef4444','#06b6d4','#f97316','#84cc16'];
                        return (
                          <div key={g.groupKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 2, backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3, wordBreak: 'break-word' }}>{g.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* ── Load Performance Matrix ── */}
          {visiblePlots.has('perf_matrix') && (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-white text-base font-semibold">Load Performance Matrix</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Group Size vs. Velocity Consistency</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {scatterData.length === 0 ? (
                <div style={{ height: 240 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Enter group sizes to populate this chart</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ height: 300, flex: 1, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 60 }}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Velocity SD" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#334155", strokeWidth: 1 }} label={{ value: 'Velocity SD (fps)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                        <YAxis type="number" dataKey="y" name="Group Size" stroke="#94a3b8" fontSize={11} tickLine={{ stroke: "#334155", strokeWidth: 1 }} axisLine={{ stroke: "#334155", strokeWidth: 1 }} width={52}
                          domain={(() => {
                            const mn2 = parseFloat(matrixYMin), mx2 = parseFloat(matrixYMax);
                            if (!isNaN(mn2) && !isNaN(mx2) && mx2 > mn2) return [mn2, mx2];
                            const vals = scatterData.map((d: any) => d.y);
                            if (!vals.length) return [0, 1];
                            const mn = Math.min(...vals), mx = Math.max(...vals);
                            const loI = Math.max(0, Math.floor(mn * 10 / 2) * 2);
                            const hiI = Math.ceil(mx * 10 / 2) * 2 + 2;
                            return [loI / 10, hiI / 10];
                          })()}
                          ticks={(() => {
                            const mn2 = parseFloat(matrixYMin), mx2 = parseFloat(matrixYMax), st2 = parseFloat(matrixYStep);
                            if (!isNaN(mn2) && !isNaN(mx2) && !isNaN(st2) && st2 > 0 && mx2 > mn2) {
                              const ticks = []; for (let t = mn2; t <= mx2 + 0.0001; t = Math.round((t + st2) * 1000) / 1000) ticks.push(t); return ticks;
                            }
                            const vals = scatterData.map((d: any) => d.y);
                            if (!vals.length) return [];
                            const mn = Math.min(...vals), mx = Math.max(...vals);
                            const loI = Math.max(0, Math.floor(mn * 10 / 2) * 2);
                            const hiI = Math.ceil(mx * 10 / 2) * 2 + 2;
                            const ticks = [];
                            for (let i = loI; i <= hiI; i += 2) ticks.push(i / 10);
                            return ticks;
                          })()}
                          tickFormatter={(v: number) => matrixUnit === 'moa' ? (inchesToMoa(v, avgDistanceYards)?.toFixed(2) ?? v.toFixed(2)) : v.toFixed(2)}
                          label={{ value: matrixUnit === 'moa' ? 'Group Size (MOA)' : 'Group Size (in)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }} />
                        <ZAxis type="number" dataKey="z" range={[50, 300]} name="Groups" />
                        {velThreshold && !isNaN(parseFloat(velThreshold)) && (
                          <ReferenceLine x={parseFloat(velThreshold)} stroke="#22c55e" strokeWidth={2} strokeDasharray="4 2" />
                        )}
                        {groupThreshold && !isNaN(parseFloat(groupThreshold)) && (
                          <ReferenceLine y={matrixUnit === 'moa' ? parseFloat(groupThreshold) * (avgDistanceYards / 100) * 1.0472 : parseFloat(groupThreshold)} stroke="#22c55e" strokeWidth={2} strokeDasharray="4 2" />
                        )}
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }: any) => { if (!payload?.length) return null; const d = payload[0]?.payload; const yVal = matrixUnit === 'moa' ? (inchesToMoa(d?.y, avgDistanceYards)?.toFixed(2) ?? d?.y) : d?.y + '"'; return (<div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}><p style={{ color: '#f59e0b', fontWeight: 600 }}>{d?.name}</p><p style={{ color: '#f8fafc' }}>Avg Vel SD: {d?.x} fps</p><p style={{ color: '#f8fafc' }}>Avg Group Size: {yVal}{matrixUnit === 'moa' ? ' MOA' : ''}</p><p style={{ color: '#94a3b8' }}>Groups: {d?.z}</p></div>); }} />
                        <Scatter data={scatterData} fill="#a855f7" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Threshold controls + unit toggle */}
                  <div style={{ flexShrink: 0, width: 148, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Y-axis unit</p>
                      <div className="flex gap-1 bg-slate-950 border border-slate-700 rounded p-0.5">
                        {(['in', 'moa'] as const).map(u => (
                          <button key={u} onClick={() => setMatrixUnit(u)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${matrixUnit === u ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
                            style={matrixUnit === u ? { backgroundColor: '#f59e0b' } : {}}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Y range</p>
                      <div className="flex flex-col gap-1">
                        <input type="number" value={matrixYMin} onChange={e => setMatrixYMin(e.target.value)} placeholder="Min"
                          className="w-full h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                        <input type="number" value={matrixYMax} onChange={e => setMatrixYMax(e.target.value)} placeholder="Max"
                          className="w-full h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                        <input type="number" value={matrixYStep} onChange={e => setMatrixYStep(e.target.value)} placeholder="Step"
                          className="w-full h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Vel SD threshold</p>
                      <input type="number" value={velThreshold} onChange={e => setVelThreshold(e.target.value)} placeholder="fps"
                        className="w-full h-7 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-green-400 placeholder-slate-600 focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Group size threshold</p>
                      <input type="number" value={groupThreshold} onChange={e => setGroupThreshold(e.target.value)} placeholder={matrixUnit === 'moa' ? 'MOA' : 'in'}
                        className="w-full h-7 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-green-400 placeholder-slate-600 focus:outline-none focus:border-green-600" />
                    </div>
                    {(velThreshold || groupThreshold) && (
                      <button onClick={() => { setVelThreshold(''); setGroupThreshold(''); }}
                        className="text-[10px] text-slate-500 hover:text-red-400 transition-colors text-center">
                        Clear thresholds
                      </button>
                    )}
                    {(matrixYMin || matrixYMax || matrixYStep) && (
                      <button onClick={() => { setMatrixYMin(''); setMatrixYMax(''); setMatrixYStep(''); }}
                        className="text-[10px] text-slate-500 hover:text-red-400 transition-colors text-center">
                        Reset Y range
                      </button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* ── Accuracy Node ── */}
          {visiblePlots.has('accuracy_node') && (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-white text-base font-semibold">Accuracy Node</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Group Size vs. Powder Charge</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">Y-axis:</span>
                <div className="flex gap-1 bg-slate-950 border border-slate-700 rounded p-0.5">
                  {(['in', 'moa'] as const).map(u => (
                    <button key={u} onClick={() => setAccuracyUnit(u)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${accuracyUnit === u ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
                      style={accuracyUnit === u ? { backgroundColor: '#f59e0b' } : {}}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {!chartData.some((d: any) => d.avgGroupSize > 0) ? (
                <div style={{ height: 220 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Enter group sizes to populate this chart</p>
                </div>
              ) : (
                <div style={{ display: 'block' }}>
                  <div style={{ height: 220, width: 580, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.filter((d: any) => d.avgGroupSize > 0).map((d: any) => ({ ...d, displayGroupSize: accuracyUnit === 'moa' ? (inchesToMoa(d.avgGroupSize, avgDistanceYards) ?? d.avgGroupSize) : d.avgGroupSize }))} margin={{ top: 10, right: 60, bottom: 40, left: 60 }}>
                        <CartesianGrid vertical={false} horizontal={false} />
                        {uniformTicks(chartData.filter((d: any) => d.avgGroupSize > 0).map((d: any) => accuracyUnit === 'moa' ? (inchesToMoa(d.avgGroupSize, avgDistanceYards) ?? d.avgGroupSize) : d.avgGroupSize)).ticks.map((t: number) => (
                          <ReferenceLine key={t} y={t} stroke="#334155" strokeWidth={1} />
                        ))}
                        <XAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11}
                          tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }} interval={0}
                          label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                          tickFormatter={(v: string) => v.replace(/gr$/, '').trim()}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                          domain={uniformTicks(chartData.filter((d: any) => d.avgGroupSize > 0).map((d: any) => accuracyUnit === 'moa' ? (inchesToMoa(d.avgGroupSize, avgDistanceYards) ?? d.avgGroupSize) : d.avgGroupSize)).domain}
                          ticks={uniformTicks(chartData.filter((d: any) => d.avgGroupSize > 0).map((d: any) => accuracyUnit === 'moa' ? (inchesToMoa(d.avgGroupSize, avgDistanceYards) ?? d.avgGroupSize) : d.avgGroupSize)).ticks}
                          tickFormatter={(v: number) => accuracyUnit === 'moa' ? v.toFixed(2) : v.toFixed(3)} width={52}
                          label={{ value: accuracyUnit === 'moa' ? 'Group Size (MOA)' : 'Group Size (in)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} formatter={(value: number) => [accuracyUnit === 'moa' ? `${value.toFixed(2)} MOA` : `${value.toFixed(3)}"`, 'Avg Group Size']} labelFormatter={(label: any) => `Charge value: ${label}`} />
                        <Line type="monotone" dataKey="displayGroupSize" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 5 }} activeDot={{ r: 7 }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* ── Velocity Consistency ── */}
          {visiblePlots.has('vel_consistency') && (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-white text-base font-semibold">Velocity Consistency</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Velocity SD vs. Powder Charge</CardDescription>
            </CardHeader>
            <CardContent className="pb-4" style={{ paddingLeft: "8%", paddingRight: "8%" }}>
              {!chartData.some((d: any) => d.avgVelSd > 0) ? (
                <div style={{ height: 220 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Upload velocity data to populate this chart</p>
                </div>
              ) : (
                <div style={{ height: 220, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 80, bottom: 40, left: 60 }}>
                      <CartesianGrid vertical={false} stroke="#334155" strokeWidth={1} />
                      <XAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11}
                        tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                        axisLine={{ stroke: "#334155", strokeWidth: 1 }} interval={0}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                        tickFormatter={(v: string) => v.replace(/gr$/, '').trim()}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={{ stroke: "#334155", strokeWidth: 1 }}
                        axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                        domain={uniformTicks(chartData.filter((d: any) => d.avgVelSd > 0).map((d: any) => d.avgVelSd)).domain}
                        ticks={uniformTicks(chartData.filter((d: any) => d.avgVelSd > 0).map((d: any) => d.avgVelSd)).ticks}
                        width={52}
                        label={{ value: 'Vel SD (fps)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }} formatter={(value: number) => [value.toFixed(1), 'Avg SD']} labelFormatter={(label: any) => `${label}`} />
                      <Line type="monotone" dataKey="avgVelSd" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          )}

        </div>
      ) : selectedRifleId ? (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-sm text-slate-500 mt-2">Log some range sessions to see load analysis.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
