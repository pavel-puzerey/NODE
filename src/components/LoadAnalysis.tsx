import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { Target, Activity, BarChart3, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { RangeSession, Rifle, Load } from '../types';

interface LoadAnalysisProps {
  sessions: RangeSession[];
  rifles: Rifle[];
  loads: Load[];
}

export function LoadAnalysis({ sessions, rifles, loads }: LoadAnalysisProps) {
  const [selectedRifleId, setSelectedRifleId] = useState<string>('');
  // Store EXCLUDED ids — everything is included by default, user unchecks to exclude
  const [excludedSessionIds, setExcludedSessionIds] = useState<string[]>([]);
  const [excludedGroupIds, setExcludedGroupIds] = useState<string[]>([]);
  const [expandedFilterDateKey, setExpandedFilterDateKey] = useState<string | null>(null);

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
    
    const loadMap = new Map<string, {
      charge: number;
      totalGroupSize: number;
      groupCount: number;
      totalVelSd: number;
      velCount: number;
      loadName: string;
    }>();

    rifleSessions.forEach(session => {
      const load = loads.find(l => l.id === session.loadId);
      if (!load) return;

      if (!loadMap.has(load.id)) {
        loadMap.set(load.id, {
          charge: load.charge,
          totalGroupSize: 0,
          groupCount: 0,
          totalVelSd: 0,
          velCount: 0,
          loadName: `${load.charge}gr`,
        });
      }

      const data = loadMap.get(load.id)!;
      
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
      .map(item => ({
        charge: item.charge,
        avgGroupSize: item.groupCount > 0 ? item.totalGroupSize / item.groupCount : 0,
        avgVelSd: item.velCount > 0 ? item.totalVelSd / item.velCount : 0,
        shots: item.groupCount,
      }))
      .filter(item => item.charge > 0)
      .sort((a, b) => a.charge - b.charge);

    return result;
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  // Process data for Scatter Chart (Load Performance Matrix)
  const scatterData = useMemo(() => {
    if (!selectedRifleId) return [];

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id));
    const loadMap = new Map<string, {
      totalGroupSize: number;
      groupCount: number;
      totalVelSd: number;
      velCount: number;
      charge: number;
    }>();

    rifleSessions.forEach(session => {
      const load = loads.find(l => l.id === session.loadId);
      if (!load) return;

      if (!loadMap.has(load.id)) {
        loadMap.set(load.id, {
          totalGroupSize: 0,
          groupCount: 0,
          totalVelSd: 0,
          velCount: 0,
          charge: load.charge,
        });
      }

      const data = loadMap.get(load.id)!;
      
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
      .map(item => ({
        name: `${item.charge}gr`,
        x: item.velCount > 0 ? Number((item.totalVelSd / item.velCount).toFixed(2)) : 0,
        y: item.groupCount > 0 ? Number((item.totalGroupSize / item.groupCount).toFixed(4)) : 0,
        z: item.groupCount,
      }))
      .filter(item => item.x > 0 || item.y > 0);
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);


  // Velocity trend — individual shot velocities over time
  const velTrendData = useMemo(() => {
    if (!selectedRifleId) return [];
    const points: { charge: number; velocity: number; date: string; temp: number | null }[] = [];
    sessions
      .filter(s => s.rifleId === selectedRifleId && !excludedSessionIds.includes(s.id))
      .forEach(s => {
        const load = loads.find(l => l.id === s.loadId);
        if (!load || !load.charge) return;
        const dateStr = s.sessionDate.slice(0, 10);
        const date = new Date(dateStr + 'T12:00:00');
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const temp = s.conditions?.temperature ?? null;
        s.groups.filter(g => !excludedGroupIds.includes(g.id)).forEach(g => {
          const vels = (g as any).velocities as number[] | undefined;
          if (vels && vels.length > 0) {
            vels.forEach(v => points.push({ charge: load.charge, velocity: v, date: label, temp }));
          }
        });
      });
    return points.sort((a, b) => a.charge - b.charge);
  }, [selectedRifleId, sessions, loads, excludedSessionIds, excludedGroupIds]);

  // Mean velocity per charge for the connecting line
  const velTrendMeans = useMemo(() => {
    if (velTrendData.length === 0) return [];
    const chargeMap = new Map<number, number[]>();
    velTrendData.forEach((d: any) => {
      if (!chargeMap.has(d.charge)) chargeMap.set(d.charge, []);
      chargeMap.get(d.charge)!.push(d.velocity);
    });
    return Array.from(chargeMap.entries())
      .map(([charge, vels]) => ({
        charge,
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

  const selectedRifle = rifles.find(r => r.id === selectedRifleId);

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
          <Select value={selectedRifleId} onValueChange={(id) => { setSelectedRifleId(id); setExcludedSessionIds([]); setExcludedGroupIds([]); }}>
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
                                {load && <span className="text-xs text-slate-400">{load.charge}gr · {load.powderId || load.bulletId || 'Unknown load'}</span>}
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
                <TrendingDown className="h-4 w-4 text-amber-400" />
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
                <Activity className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="stat-readout">
                  {rifleStats.avgVelSd > 0 ? `${rifleStats.avgVelSd.toFixed(1)}` : '--'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Average standard deviation</p>
              </CardContent>
            </Card>
          </div>

          {/* Velocity Trend Over Time */}
          <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <CardTitle className="text-white">Velocity Trend</CardTitle>
                    <CardDescription className="text-slate-400">
                      Individual shot velocities over time — spot drift, temperature sensitivity, or barrel wear
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full relative">
                  {velTrendData.length < 2 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-lg" style={{ backgroundColor: 'rgba(10,10,10,0.75)' }}>
                      <TrendingUp className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-slate-500 text-sm font-medium">No velocity data yet</p>
                      <p className="text-slate-600 text-xs mt-1">Upload a velocity file in Range Session to populate this chart</p>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" dataKey="charge" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} ticks={velTrendXTicks} domain={velTrendXTicks.length > 0 ? [velTrendXTicks[0] - 0.3, velTrendXTicks[velTrendXTicks.length - 1] + 0.3] : ['auto', 'auto']} tickFormatter={(v: number) => `${v}gr`} label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                      <YAxis type="number" dataKey="velocity" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={velTrendYAxis.domain} ticks={velTrendYAxis.ticks} label={{ value: 'Velocity (fps)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                              <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 2 }}>{d?.charge}gr{d?.date ? ` · ${d?.date}` : ' (mean)'}</p>
                              {d?.temp !== null && d?.temp !== undefined && d?.temp !== 0 && <p style={{ color: '#94a3b8', marginBottom: 2 }}>Temp: {d?.temp}°F</p>}
                              <p style={{ color: d?.date ? '#d97706' : '#3b82f6', fontWeight: 600 }}>{d?.velocity} fps</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={velTrendData} fill="#d97706" opacity={0.7} r={4} />
                      <Scatter
                        data={velTrendMeans}
                        fill="#3b82f6"
                        r={6}
                        line={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        lineType="joint"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 justify-center mt-2 text-xs text-slate-500">
                  <span><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1 align-middle opacity-70"></span>Individual shots</span>
                  <span><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1 align-middle"></span>Group mean</span>
                </div>
              </CardContent>
            </Card>

          {/* Load Performance Matrix (Scatter Chart) */}
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <CardTitle className="text-white">Load Performance Matrix</CardTitle>
                  <CardDescription className="text-slate-400">
                    Group Size vs. Velocity Consistency (Lower left is optimal)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full relative">
                {scatterData.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-lg" style={{ backgroundColor: 'rgba(10,10,10,0.75)' }}>
                    <BarChart3 className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-slate-500 text-sm font-medium">No data yet</p>
                    <p className="text-slate-600 text-xs mt-1">Enter group sizes in Range Session to populate this chart</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Velocity SD"
                      stroke="#94a3b8"
                      label={{ value: 'Velocity SD (fps)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Group Size"
                      stroke="#94a3b8"
                      label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }}
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Samples" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Velocity SD') return [`${value} fps`, 'Avg Vel SD'];
                        if (name === 'Group Size') return [`${value}"`, 'Avg Group Size'];
                        if (name === 'Samples') return [value, 'Groups Fired'];
                        return [value, name];
                      }}
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                            <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>Charge: {d?.name}</p>
                            <p style={{ color: '#f8fafc' }}>Avg Vel SD: {d?.x} fps</p>
                            <p style={{ color: '#f8fafc' }}>Avg Group Size: {d?.y}&quot;</p>
                            <p style={{ color: '#94a3b8' }}>Groups: {d?.z}</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} fill="#a855f7" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Size vs Charge Chart */}
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  <div>
                    <CardTitle className="text-white">Accuracy Node</CardTitle>
                    <CardDescription className="text-slate-400">
                      Group Size vs. Powder Charge (Lower is better)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="charge" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number) => [value.toFixed(3), 'Avg Size']}
                        labelFormatter={(label) => `Charge: ${label}gr`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgGroupSize" 
                        stroke="#d97706" 
                        strokeWidth={2}
                        dot={{ fill: '#d97706', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Velocity SD vs Charge Chart */}
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-white">Velocity Consistency</CardTitle>
                    <CardDescription className="text-slate-400">
                      Velocity SD vs. Powder Charge (Lower is better)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="charge" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Vel SD (fps)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number) => [value.toFixed(1), 'Avg SD']}
                        labelFormatter={(label) => `Charge: ${label}gr`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgVelSd" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

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