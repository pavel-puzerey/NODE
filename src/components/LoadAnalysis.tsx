import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  // Store EXCLUDED ids — everything is included by default, user unchecks to exclude
  const [excludedSessionIds, setExcludedSessionIds] = useState<string[]>([]);
  const [excludedGroupIds, setExcludedGroupIds] = useState<string[]>([]);
  const [expandedFilterDateKey, setExpandedFilterDateKey] = useState<string | null>(null);
  const [selectedTraceGroups, setSelectedTraceGroups] = useState<string[]>([]);
  const [visiblePlots, setVisiblePlots] = useState<Set<string>>(new Set());
  const [plotMenuOpen, setPlotMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
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

  // Calculate Summary Statistics for the selected rifle
  const rifleStats = useMemo(() => {
    if (!selectedRifleId) return null;

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const allGroups = rifleSessions.flatMap(s => s.groups.filter(g => !excludedGroupIds.includes(g.id)));
    if (allGroups.length === 0) return null;

    const totalGroups = allGroups.length;
    
    // Find best group (smallest size > 0)
    const validGroups = allGroups.filter(g => g.groupSize > 0);
    const bestGroupSize = validGroups.length > 0 
      ? Math.min(...validGroups.map(g => g.groupSize)) 
      : 0;

    // Calculate Average Velocity SD
    const totalVelSd = allGroups.reduce((sum, g) => sum + g.velocitySd, 0);
    const avgVelSd = totalVelSd / allGroups.length;

    return {
      totalGroups,
      bestGroupSize,
      avgVelSd,
    };
  }, [selectedRifleId, sessions, excludedSessionIds, excludedGroupIds]);

  // Process data for line charts (Group Size vs Charge & Velocity SD vs Charge)
  const chartData = useMemo(() => {
    if (!selectedRifleId) return [];

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const loadMap = new Map<string, any>();

    rifleSessions.forEach(session => {
      const meta = getSessionMeta(session);
      if (!loadMap.has(meta.key)) {
        loadMap.set(meta.key, { charge: meta.charge, totalGroupSize: 0, groupCount: 0, totalVelSd: 0, velCount: 0, loadName: meta.label } as any);
      }
      const data = loadMap.get(meta.key)!;
      
      session.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(group => {
        if (group.groupSize > 0) {
          data.totalGroupSize += group.groupSize;
          data.groupCount++;
        }
        const vels = (group as any).velocities as number[] | undefined;
        const sdToUse = group.velocitySd > 0 ? group.velocitySd : (() => {
          if (!vels || vels.length < 2) return 0;
          const mean = vels.reduce((a: number, b: number) => a + b, 0) / vels.length;
          return Math.sqrt(vels.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (vels.length - 1));
        })();
        if (sdToUse > 0) {
          data.totalVelSd += sdToUse;
          data.velCount++;
        }
      });
    });
    const result = Array.from(loadMap.values())
      .map((item: any) => ({
        charge: item.charge,
        label: item.loadName,
        avgGroupSize: item.groupCount > 0 ? item.totalGroupSize / item.groupCount : 0,
        avgVelSd: item.velCount > 0 ? item.totalVelSd / item.velCount : 0,
        shots: item.groupCount || item.velCount,
      }))
      .filter((item: any) => item.avgVelSd > 0 || item.avgGroupSize > 0)
      .sort((a, b) => a.charge - b.charge);

    return result;
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  // Process data for Scatter Chart (Load Performance Matrix)
  const scatterData = useMemo(() => {
    if (!selectedRifleId) return [];

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const loadMap = new Map<string, any>();

    rifleSessions.forEach(session => {
      const meta = getSessionMeta(session);
      if (!loadMap.has(meta.key)) {
        loadMap.set(meta.key, { totalGroupSize: 0, groupCount: 0, totalVelSd: 0, velCount: 0, charge: meta.charge, label: meta.label } as any);
      }
      const data = loadMap.get(meta.key)!;
      
      session.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(group => {
        if (group.groupSize > 0) {
          data.totalGroupSize += group.groupSize;
          data.groupCount++;
        }
        const vels = (group as any).velocities as number[] | undefined;
        const sdToUse = group.velocitySd > 0 ? group.velocitySd : (() => {
          if (!vels || vels.length < 2) return 0;
          const mean = vels.reduce((a: number, b: number) => a + b, 0) / vels.length;
          return Math.sqrt(vels.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (vels.length - 1));
        })();
        if (sdToUse > 0) {
          data.totalVelSd += sdToUse;
          data.velCount++;
        }
      });
    });

    return Array.from(loadMap.values())
      .map((item: any) => ({
        name: item.label || `${item.charge}gr`,
        x: item.velCount > 0 ? Number((item.totalVelSd / item.velCount).toFixed(2)) : 0,
        y: item.groupCount > 0 ? Number((item.totalGroupSize / item.groupCount).toFixed(4)) : 0,
        z: item.groupCount,
      }))
      .filter((item: any) => item.z > 0);
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);


  // Velocity trend — individual shot velocities over time
  const velTrendData = useMemo(() => {
    if (!selectedRifleId) return [];
    const points: { charge: number; chargeLabel: string; velocity: number; date: string; temp: number | null }[] = [];
    sessions
      .filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id))
      .forEach(s => {
        const meta = getSessionMeta(s);
        const dateStr = s.sessionDate.slice(0, 10);
        const date = new Date(dateStr + 'T12:00:00');
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const temp = s.conditions?.temperature ?? null;
        s.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(g => {
          const vels = (g as any).velocities as number[] | undefined;
          if (vels && vels.length > 0) {
            vels.forEach(v => points.push({ charge: meta.charge, chargeLabel: meta.label, velocity: v, date: dateLabel, temp }));
          }
        });
      });
    return points.sort((a, b) => a.charge - b.charge);
  }, [selectedRifleId, sessions, loads, ammo, excludedSessionIds, excludedGroupIds]);

  // Mean velocity per charge for the connecting line
  const velTrendMeans = useMemo(() => {
    if (velTrendData.length === 0) return [];
    const chargeMap = new Map<number, { vels: number[]; label: string }>();
    velTrendData.forEach((d: any) => {
      if (!chargeMap.has(d.charge)) chargeMap.set(d.charge, { vels: [], label: d.chargeLabel || String(d.charge) });
      chargeMap.get(d.charge)!.vels.push(d.velocity);
    });
    return Array.from(chargeMap.entries())
      .map(([charge, { vels, label }]) => ({
        charge, chargeLabel: label,
        velocity: Number((vels.reduce((a, b) => a + b, 0) / vels.length).toFixed(1)),
      }))
      .sort((a, b) => a.charge - b.charge);
  }, [velTrendData]);

  const velTrendXTicks = useMemo(() => {
    if (velTrendData.length === 0) return [];
    const charges = [...new Set(velTrendData.map((d: any) => d.charge as number))].sort((a, b) => a - b);
    return charges;
  }, [velTrendData]);

  const velTrendYAxis = useMemo(() => {
    if (velTrendData.length === 0) return { domain: [0, 3500] as [number, number], ticks: undefined };
    const velocities = velTrendData.map((d: any) => d.velocity as number).filter(Boolean);
    if (velocities.length === 0) return { domain: [0, 3500] as [number, number], ticks: undefined };
    const min = Math.min(...velocities);
    const max = Math.max(...velocities);
    const lo = Math.floor((min - 50) / 10) * 10;
    const hi = Math.ceil((max + 50) / 10) * 10;
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
    sessions
      .filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id))
      .forEach(s => {
        const load = loads.find(l => l.id === s.loadId);
        const dateStr = s.sessionDate.slice(0, 10);
        const date = new Date(dateStr + 'T12:00:00');
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        s.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(g => {
          const vels = (g as any).velocities as number[] | undefined;
          const times = (g as any).velocityTimes as string[] | undefined;
          if (!vels || vels.length === 0) return;
          groups.push({
            groupKey: g.id,
            label: `${dateLabel} · G${g.groupId}${load ? ` · ${load.charge}gr` : ''}`,
            points: vels.map((v, i) => ({
              shot: i + 1,
              velocity: v,
              time: times?.[i] || '',
            })),
          });
        });
      });
    return groups;
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  const prevTraceKeys = useRef<string[]>([]);
  useEffect(() => {
    const keys = velTraceData.map(g => g.groupKey);
    if (keys.length > 0 && !keys.some(k => prevTraceKeys.current.includes(k))) {
      setSelectedTraceGroups([keys[0]]);
    }
    prevTraceKeys.current = keys;
  }, [velTraceData]);

  const selectedRifle = rifles.find(r => r.id === selectedRifleId);

  const customYAxis = (() => {
    const min = parseFloat(yMin);
    const max = parseFloat(yMax);
    const step = parseFloat(yStep);
    if (!isNaN(min) && !isNaN(max) && !isNaN(step) && step > 0 && max > min) {
      const ticks: number[] = [];
      for (let t = min; t <= max + 0.001; t += step) ticks.push(Math.round(t * 100) / 100);
      return { domain: [min, max] as [number, number], ticks };
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Load Analysis</h2>
        </div>
      </div>

      {/* Rifle Selector */}
      <Card className="bg-slate-900 border-slate-800 card-tactical">
        <CardHeader>
          <CardTitle className="text-white">Select Rifle</CardTitle>
          <CardDescription className="text-slate-400">
            Choose a rifle to view load performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRifleId} onValueChange={(id: string) => { setSelectedRifleId(id); setExcludedSessionIds([]); setExcludedGroupIds([]); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select a rifle..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {rifles.map(rifle => (
                <SelectItem key={rifle.id} value={rifle.id} className="text-white">
                  {rifle.caliber} - {rifle.action}
                </SelectItem>
              ))}
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
                <button
                  onClick={() => { setExcludedSessionIds([]); setExcludedGroupIds([]); }}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >Select all</button>
                <button
                  onClick={() => {
                    const rs = sessions.filter(s => s.rifleId === selectedRifleId);
                    setExcludedSessionIds(rs.map(s => s.id));
                    setExcludedGroupIds(rs.flatMap(s => s.groups.map(g => g.id)));
                  }}
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >Clear all</button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {(() => {
              const rifleSessions = sessions
                .filter(s => s.rifleId === selectedRifleId)
                .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
              const grouped: Record<string, typeof rifleSessions> = {};
              rifleSessions.forEach(s => {
                const dk = s.sessionDate.slice(0, 10);
                if (!grouped[dk]) grouped[dk] = [];
                grouped[dk].push(s);
              });
              return Object.entries(grouped).map(([dateKey, dateSessions]) => {
                const dateLabel = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isExpanded = expandedFilterDateKey === dateKey;
                const totalGroups = dateSessions.reduce((sum, s) => sum + s.groups.length, 0);
                const allSessionIds = dateSessions.map(s => s.id);
                const allGroupIds = dateSessions.flatMap(s => s.groups.map(g => g.id));
                const anyOn = allSessionIds.some(id => !excludedSessionIds.includes(id));
                return (
                  <div key={dateKey} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                    {/* Date header row */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <button
                        onClick={() => {
                          if (anyOn) {
                            setExcludedSessionIds(prev => [...prev, ...allSessionIds.filter(id => !prev.includes(id))]);
                            setExcludedGroupIds(prev => [...prev, ...allGroupIds.filter(id => !prev.includes(id))]);
                          } else {
                            setExcludedSessionIds(prev => prev.filter(id => !allSessionIds.includes(id)));
                            setExcludedGroupIds(prev => prev.filter(id => !allGroupIds.includes(id)));
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-3 h-3 rounded-sm border flex-shrink-0 transition-colors ${anyOn ? 'border-amber-500 bg-amber-500' : 'border-slate-600'}`} />
                      </button>
                      <button
                        onClick={() => setExpandedFilterDateKey(isExpanded ? null : dateKey)}
                        className="flex items-center gap-2 flex-1 text-left px-2"
                      >
                        <span className="text-xs font-semibold text-white">{dateLabel}</span>
                        <span className="text-xs text-slate-500">{dateSessions.length} {dateSessions.length === 1 ? 'session' : 'sessions'} · {totalGroups} groups</span>
                      </button>
                      <button
                        onClick={() => setExpandedFilterDateKey(isExpanded ? null : dateKey)}
                        className="text-slate-500"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {/* Expanded: sessions and groups */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 px-3 py-2 space-y-2">
                        {dateSessions.map(session => {
                          const load = loads.find(l => l.id === session.loadId);
                          const sessionOn = !excludedSessionIds.includes(session.id);
                          return (
                            <div key={session.id}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <button
                                  onClick={() => {
                                    const gids = session.groups.map(g => g.id);
                                    if (sessionOn) {
                                      setExcludedSessionIds(prev => [...prev, session.id]);
                                      setExcludedGroupIds(prev => [...prev, ...gids.filter(id => !prev.includes(id))]);
                                    } else {
                                      setExcludedSessionIds(prev => prev.filter(id => id !== session.id));
                                      setExcludedGroupIds(prev => prev.filter(id => !gids.includes(id)));
                                    }
                                  }}
                                  className="flex items-center gap-2"
                                >
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
                                    <button
                                      key={group.id}
                                      onClick={() => {
                                        if (groupOn) setExcludedGroupIds(prev => [...prev, group.id]);
                                        else setExcludedGroupIds(prev => prev.filter(id => id !== group.id));
                                      }}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors ${groupOn ? 'border-amber-600 text-amber-400 bg-amber-900/20' : 'border-slate-700 text-slate-600'}`}
                                    >
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
                <div className="stat-readout">
                  {rifleStats.bestGroupSize > 0 ? `${rifleStats.bestGroupSize.toFixed(4)}"` : '--'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Smallest group recorded</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Velocity SD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-readout">
                  {rifleStats.avgVelSd > 0 ? `${rifleStats.avgVelSd.toFixed(1)}` : '--'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Average standard deviation</p>
              </CardContent>
            </Card>
          </div>

          {/* Plot selector */}
          <div className="relative">
            <button
              onClick={() => { setPlotMenuOpen((p: boolean) => !p); setGroupMenuOpen(false); }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
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
                    <button key={opt.id}
                      onClick={() => setVisiblePlots(prev => { const n = new Set(prev); if (n.has(opt.id)) n.delete(opt.id); else n.add(opt.id); return n; })}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                        {on && <span className="text-slate-900 text-[10px] font-black">✓</span>}
                      </div>
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
              <CardDescription className="text-slate-400 text-xs">Individual shot velocities over time</CardDescription>
            </CardHeader>
            <CardContent className="pb-4" style={{ paddingLeft: "8%", paddingRight: "8%" }}>
              {/* Y-axis controls */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs text-slate-500 mr-1 whitespace-nowrap">Y:</span>
                <input type="number" value={yMin} onChange={e => setYMin(e.target.value)} placeholder="Min"
                  className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                <span className="text-xs text-slate-600">to</span>
                <input type="number" value={yMax} onChange={e => setYMax(e.target.value)} placeholder="Max"
                  className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                <span className="text-xs text-slate-600">step</span>
                <input type="number" value={yStep} onChange={e => setYStep(e.target.value)} placeholder="Step"
                  className="w-16 h-6 text-xs text-center font-mono bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
                {(yMin || yMax || yStep) && (
                  <button onClick={() => { setYMin(''); setYMax(''); setYStep(''); }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-0.5 border border-slate-700 rounded ml-1">
                    Reset
                  </button>
                )}
              </div>
              {velTrendData.length === 0 ? (
                <div style={{ height: 250 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No velocity data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Upload a velocity file in Range Session</p>
                </div>
              ) : (
                <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 80, bottom: 40, left: 60 }}>
                        <CartesianGrid vertical={false} stroke="#334155" strokeWidth={1} />
                        <XAxis type="number" dataKey="charge" stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                          ticks={velTrendXTicks}
                          domain={velTrendXTicks.length > 0 ? [velTrendXTicks[0] - 0.3, velTrendXTicks[velTrendXTicks.length - 1] + 0.3] : ['auto', 'auto']}
                          tickFormatter={(v: number) => { const pt = velTrendData.find((d: any) => d.charge === v); return pt ? pt.chargeLabel : `${v}gr`; }}
                          label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                        />
                        <YAxis type="number" dataKey="velocity" stroke="#94a3b8" fontSize={11} tickLine={{ stroke: "#334155", strokeWidth: 1 }}
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
                                <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 2 }}>{d?.chargeLabel}{d?.date ? ` · ${d?.date}` : ' (mean)'}</p>
                                {d?.temp != null && d.temp !== 0 && <p style={{ color: '#94a3b8', marginBottom: 2 }}>Temp: {d.temp}°F</p>}
                                <p style={{ color: d?.date ? '#d97706' : '#3b82f6', fontWeight: 600 }}>{d?.velocity} fps</p>
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
                    <button onClick={() => { setGroupMenuOpen((p: boolean) => !p); setPlotMenuOpen(false); }}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
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
                            <button key={g.groupKey}
                              onClick={() => setSelectedTraceGroups((prev: string[]) => { const n=[...prev]; const i=n.indexOf(g.groupKey); if(i>=0) n.splice(i,1); else n.push(g.groupKey); return n; })}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left">
                              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${on ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                {on && <span className="text-slate-900 text-[10px] font-black">✓</span>}
                              </div>
                              <span className="text-sm text-slate-300">{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'block' }}>
                    <div style={{ height: 280, width: 680, margin: '0 auto' }}>
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
                            ticks={(() => {
                              const maxShot = Math.max(...velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.shot)), 1);
                              return Array.from({ length: maxShot }, (_, i) => i + 1);
                            })()}
                            domain={(() => {
                              const maxShot = Math.max(...velTraceData.filter((g: any) => selectedTraceGroups.includes(g.groupKey)).flatMap((g: any) => g.points.map((p: any) => p.shot)), 1);
                              return [0, maxShot + 1];
                            })()}
                            label={{ value: 'Shot #', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                          />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}
                            axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                            domain={['auto', 'auto']} width={52}
                            label={{ value: 'Velocity (fps)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            content={({ payload }: any) => {
                              if (!payload?.length) return null;
                              return (
                                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                                  {payload.map((p: any, i: number) => (
                                    <div key={i} style={{ marginBottom: i < payload.length - 1 ? 6 : 0 }}>
                                      <p style={{ color: p.stroke, fontWeight: 600, marginBottom: 1 }}>{p.name}</p>
                                      <p style={{ color: '#94a3b8' }}>Shot {p.payload.shot}{p.payload.time ? ` · ${p.payload.time}` : ''}</p>
                                      <p style={{ color: p.stroke, fontWeight: 700 }}>{p.payload.velocity} fps</p>
                                    </div>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          {(() => {
                            const COLORS = ['#d97706','#3b82f6','#22c55e','#a855f7','#ef4444','#06b6d4','#f97316','#84cc16'];
                            return velTraceData
                              .filter((g: any) => selectedTraceGroups.includes(g.groupKey))
                              .map((g: any, i: number) => (
                                <Line key={g.groupKey} data={g.points} type="linear" dataKey="velocity"
                                  name={g.label} stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                                  dot={{ r: 4, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 6 }} connectNulls />
                              ));
                          })()}
                        </LineChart>
                      </ResponsiveContainer>
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
                <div style={{ display: 'block' }}>
                  <div style={{ height: 240, width: 560, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 80, bottom: 40, left: 60 }}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Velocity SD" stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                          label={{ value: 'Velocity SD (fps)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                        />
                        <YAxis type="number" dataKey="y" name="Group Size" stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }} width={52}
                          tickFormatter={(v: number) => v.toFixed(3)}
                          label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 300]} name="Groups" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }}
                          content={({ payload }: any) => {
                            if (!payload?.length) return null;
                            const d = payload[0]?.payload;
                            return (
                              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                                <p style={{ color: '#f59e0b', fontWeight: 600 }}>{d?.name}</p>
                                <p style={{ color: '#f8fafc' }}>Avg Vel SD: {d?.x} fps</p>
                                <p style={{ color: '#f8fafc' }}>Avg Group Size: {d?.y}"</p>
                                <p style={{ color: '#94a3b8' }}>Groups: {d?.z}</p>
                              </div>
                            );
                          }}
                        />
                        <Scatter data={scatterData} fill="#a855f7" />
                      </ScatterChart>
                    </ResponsiveContainer>
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
              {!chartData.some((d: any) => d.avgGroupSize > 0) ? (
                <div style={{ height: 220 }} className="flex flex-col items-center justify-center text-center">
                  <p className="text-slate-500 text-sm">No data yet</p>
                  <p className="text-slate-600 text-xs mt-1">Enter group sizes to populate this chart</p>
                </div>
              ) : (
                <div style={{ display: 'block' }}>
                  <div style={{ height: 220, width: 560, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.filter((d: any) => d.avgGroupSize > 0)} margin={{ top: 10, right: 10, bottom: 40, left: 60 }}>
                        <CartesianGrid vertical={false} stroke="#334155" strokeWidth={1} />
                        <XAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }} interval={0}
                          label={{ value: 'Load', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                          domain={([dataMin, dataMax]: number[]) => [Math.max(0, dataMin - 0.05), dataMax + 0.05]}
                          tickFormatter={(v: number) => v.toFixed(3)} width={52}
                          label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }}
                          formatter={(value: number) => [`${value.toFixed(3)}"`, 'Avg Group Size']}
                          labelFormatter={(label: any) => `${label}`}
                        />
                        <Line type="monotone" dataKey="avgGroupSize" stroke="#d97706" strokeWidth={2}
                          dot={{ fill: '#d97706', r: 5 }} activeDot={{ r: 7 }} isAnimationActive={false} />
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
                        <XAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }} interval={0}
                          label={{ value: 'Load', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}
                          axisLine={{ stroke: "#334155", strokeWidth: 1 }}
                          domain={([dataMin, dataMax]: number[]) => [Math.max(0, dataMin - 2), dataMax + 2]}
                          width={52}
                          label={{ value: 'Vel SD (fps)', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', style: { textAnchor: 'middle' } }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }}
                          formatter={(value: number) => [value.toFixed(1), 'Avg SD']}
                          labelFormatter={(label: any) => `${label}`}
                        />
                        <Line type="monotone" dataKey="avgVelSd" stroke="#3b82f6" strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} isAnimationActive={false} />
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