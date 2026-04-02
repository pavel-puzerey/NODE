import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Target } from 'lucide-react';
import { RangeSession, Load } from '../types';

interface LoadPerformanceChartProps {
  sessions: RangeSession[];
  loads: Load[];
}

export function LoadPerformanceChart({ sessions, loads }: LoadPerformanceChartProps) {
  const data = useMemo(() => {
    return loads
      .map((load) => {
        // Find all sessions for this specific load
        const loadSessions = sessions.filter((s) => s.loadId === load.id);
        
        // Flatten all groups from these sessions
        const allGroups = loadSessions.flatMap((s) => s.groups);

        if (allGroups.length === 0) return null;

        // Calculate averages
        const totalGroupSize = allGroups.reduce((sum, g) => sum + g.groupSize, 0);
        const totalVelSd = allGroups.reduce((sum, g) => sum + g.velocitySd, 0);
        
        const avgGroupSize = totalGroupSize / allGroups.length;
        const avgVelSd = totalVelSd / allGroups.length;

        return {
          name: `${load.charge}gr`,
          charge: load.charge,
          x: Number(avgVelSd.toFixed(2)), // Velocity SD (X-axis)
          y: Number(avgGroupSize.toFixed(3)), // Group Size (Y-axis)
          z: allGroups.length, // Number of data points (bubble size)
          loadId: load.id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [sessions, loads]);

  return (
    <Card className="bg-slate-900 border-slate-800 card-tactical">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          <div>
            <CardTitle className="text-white">Load Performance Analysis</CardTitle>
            <CardDescription className="text-slate-400">
              Group Size vs. Velocity Consistency (Lower is better for both)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
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
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Groups" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Velocity SD') return [`${value} fps`, 'Avg Velocity SD'];
                    if (name === 'Group Size') return [`${value} in`, 'Avg Group Size'];
                    if (name === 'Groups') return [value, 'Samples'];
                    return [value, name];
                  }}
                />
                <Scatter name="Loads" data={data} fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No session data available to generate chart.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}