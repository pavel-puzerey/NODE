import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Target, Activity, TrendingDown } from 'lucide-react';
import { RangeSession, Rifle, Load } from '../types';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardProps {
  sessions: RangeSession[];
  rifles: Rifle[];
  loads: Load[];
}

export function Dashboard({ sessions, rifles, loads }: DashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    
    let bestGroupSize = Infinity;
    let totalVelocitySd = 0;
    let velocityCount = 0;

    sessions.forEach(session => {
      session.groups.forEach(group => {
        if (group.groupSize > 0 && group.groupSize < bestGroupSize) {
          bestGroupSize = group.groupSize;
        }
        if (group.velocitySd > 0) {
          totalVelocitySd += group.velocitySd;
          velocityCount++;
        }
      });
    });

    const avgVelocitySd = velocityCount > 0 ? totalVelocitySd / velocityCount : 0;

    return {
      totalSessions,
      bestGroupSize: bestGroupSize === Infinity ? 0 : bestGroupSize,
      avgVelocitySd,
    };
  }, [sessions]);

  // Prepare data for Group Size Trend Chart
  const trendData = useMemo(() => {
    return sessions
      .slice() // Create a copy to avoid mutating original
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
      .map(session => {
        const sessionBestGroup = session.groups.reduce((min, group) => 
          group.groupSize < min ? group.groupSize : min, Infinity
        );
        return {
          date: format(new Date(session.sessionDate), 'MMM dd'),
          size: sessionBestGroup === Infinity ? 0 : parseFloat(sessionBestGroup.toFixed(4)),
        };
      });
  }, [sessions]);

  // Prepare data for Velocity Consistency Chart
  const velocityData = useMemo(() => {
    return sessions
      .slice()
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
      .map(session => {
        const sessionAvgSd = session.groups.length > 0
          ? session.groups.reduce((sum, group) => sum + group.velocitySd, 0) / session.groups.length
          : 0;
        return {
          date: format(new Date(session.sessionDate), 'MMM dd'),
          sd: parseFloat(sessionAvgSd.toFixed(1)),
        };
      });
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="stat-readout">Performance Dashboard</h2>
        <p className="text-slate-400">Track your shooting progress and load consistency</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="stat-readout">{stats.totalSessions}</div>
            <p className="text-xs text-slate-500 mt-1">Logged range sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Best Group Size</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="stat-readout">
              {stats.bestGroupSize > 0 ? `${stats.bestGroupSize.toFixed(4)}"` : '--'}
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
              {stats.avgVelocitySd > 0 ? `${stats.avgVelocitySd.toFixed(1)}` : '--'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Average standard deviation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Size Trend */}
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader>
            <CardTitle className="text-white">Group Size Trend</CardTitle>
            <CardDescription className="text-slate-400">
              Best group size per session over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="size" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No data available for chart
              </div>
            )}
          </CardContent>
        </Card>

        {/* Velocity Consistency */}
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader>
            <CardTitle className="text-white">Velocity Consistency</CardTitle>
            <CardDescription className="text-slate-400">
              Average Velocity SD per session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {velocityData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Bar 
                      dataKey="sd" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No data available for chart
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}