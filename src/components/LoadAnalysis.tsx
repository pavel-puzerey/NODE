import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Target, Activity, BarChart3, TrendingDown } from 'lucide-react';
import { RangeSession, Rifle, Load } from '../types';

interface LoadAnalysisProps {
  sessions: RangeSession[];
  rifles: Rifle[];
  loads: Load[];
}

export function LoadAnalysis({ sessions, rifles, loads }: LoadAnalysisProps) {
  const [selectedRifleId, setSelectedRifleId] = useState<string>('');

  // Calculate Summary Statistics for the selected rifle
  const rifleStats = useMemo(() => {
    if (!selectedRifleId) return null;

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId);
    const allGroups = rifleSessions.flatMap(s => s.groups);

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
  }, [selectedRifleId, sessions]);

  // Process data for line charts (Group Size vs Charge & Velocity SD vs Charge)
  const chartData = useMemo(() => {
    if (!selectedRifleId) return [];

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId);
    
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
      
      session.groups.forEach(group => {
        if (group.groupSize > 0) {
          data.totalGroupSize += group.groupSize;
          data.groupCount++;
        }
        if (group.velocitySd > 0) {
          data.totalVelSd += group.velocitySd;
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
  }, [selectedRifleId, sessions, loads]);

  // Process data for Scatter Chart (Load Performance Matrix)
  const scatterData = useMemo(() => {
    if (!selectedRifleId) return [];

    const rifleSessions = sessions.filter(s => s.rifleId === selectedRifleId);
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
      
      session.groups.forEach(group => {
        if (group.groupSize > 0) {
          data.totalGroupSize += group.groupSize;
          data.groupCount++;
        }
        if (group.velocitySd > 0) {
          data.totalVelSd += group.velocitySd;
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
  }, [selectedRifleId, sessions, loads]);

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
          <Select value={selectedRifleId} onValueChange={setSelectedRifleId}>
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
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="charge" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
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
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="charge" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Charge (gr)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Vel SD (fps)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
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
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Velocity SD" 
                      unit=" fps" 
                      stroke="#94a3b8"
                      label={{ value: 'Velocity SD (fps)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Group Size" 
                      unit=" in" 
                      stroke="#94a3b8"
                      label={{ value: 'Group Size (in)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
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
                    />
                    <Scatter data={scatterData} fill="#a855f7" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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