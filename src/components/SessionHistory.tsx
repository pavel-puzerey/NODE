import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Calendar, Trash2, Download, Thermometer, Wind, Droplets } from 'lucide-react';
import { RangeSession, Rifle, Load } from '../types';
import { format } from 'date-fns';

interface SessionHistoryProps {
  sessions: RangeSession[];
  setSessions: (sessions: RangeSession[] | ((prev: RangeSession[]) => RangeSession[])) => void;
  rifles: Rifle[];
  loads: Load[];
}

export function SessionHistory({ sessions, setSessions, rifles, loads }: SessionHistoryProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const deleteSession = (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  const getRifleLabel = (id: string) => {
    const rifle = rifles.find(r => r.id === id);
    return rifle ? `${rifle.caliber} - ${rifle.action}` : 'Unknown Rifle';
  };

  const getLoadLabel = (id: string) => {
    const load = loads.find(l => l.id === id);
    if (!load) return 'Unknown Load';
    return `Load #${load.id.slice(0, 6)} - ${load.charge}gr`;
  };

  const exportToCSV = () => {
    if (sessions.length === 0) {
      alert('No sessions to export');
      return;
    }

    const headers = [
      'Date',
      'Rifle',
      'Load',
      'Temp (F)',
      'Humidity (%)',
      'Wind (mph)',
      'Wind Dir',
      'Group #',
      'Group Size (in)',
      'Extreme Spread (in)',
      'Group SD (in)',
      'Rounds',
      'Velocity ES (fps)',
      'Velocity SD (fps)',
      'Session Notes'
    ];

    const csvRows: string[][] = [headers];

    sessions.forEach(session => {
      const rifleLabel = getRifleLabel(session.rifleId);
      const loadLabel = getLoadLabel(session.loadId);
      const dateStr = format(new Date(session.sessionDate), 'yyyy-MM-dd HH:mm');
      
      // Extract conditions
      const temp = session.conditions?.temperature ?? '';
      const humidity = session.conditions?.humidity ?? '';
      const windSpeed = session.conditions?.windSpeed ?? '';
      const windDir = session.conditions?.windDirection ?? '';

      if (session.groups.length === 0) {
        csvRows.push([
          dateStr, rifleLabel, loadLabel, temp.toString(), humidity.toString(), 
          windSpeed.toString(), windDir, '0', '0', '0', '0', '0', '0', '0', session.notes || ''
        ]);
      } else {
        session.groups.forEach(group => {
          csvRows.push([
            dateStr, rifleLabel, loadLabel, temp.toString(), humidity.toString(), 
            windSpeed.toString(), windDir, group.groupId.toString(), 
            group.groupSize.toFixed(4), group.extremeSpread.toFixed(4), 
            group.groupSd.toFixed(4), group.rounds.toString(), 
            group.velocityEs.toString(), group.velocitySd.toString(), 
            session.notes || ''
          ]);
        });
      }
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `precision_rifle_data_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Session History</h2>
        <Button 
          onClick={exportToCSV}
          variant="outline" 
          size="sm"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="h-[600px] overflow-y-auto pr-4">
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardContent className="pt-6">
                <p className="text-center text-slate-400">No sessions recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map(session => (
              <Card 
                key={session.id} 
                className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <CardHeader 
                  className="pb-3"
                  onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(session.sessionDate), 'MMM dd, yyyy • HH:mm')}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-sm">
                        {getRifleLabel(session.rifleId)} • {getLoadLabel(session.loadId)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                        {session.groups.length} {session.groups.length === 1 ? 'group' : 'groups'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedSessionId === session.id && (
                  <CardContent className="pt-0 border-t border-slate-700">
                    {/* Environmental Conditions Display */}
                    {session.conditions && (
                      <div className="py-4 mb-4 bg-slate-900/50 rounded-lg px-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Wind className="w-3 h-3" /> Conditions
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            <span>{session.conditions.temperature}°F</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Wind className="w-4 h-4 text-blue-400" />
                            <span>{session.conditions.windSpeed} mph {session.conditions.windDirection}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            <span>{session.conditions.humidity}%</span>
                          </div>
                          {session.conditions.pressure && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <span className="text-slate-500">Pressure:</span>
                              <span>{session.conditions.pressure} inHg</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      {session.groups.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No groups recorded in this session.</p>
                      ) : (
                        session.groups.map(group => (
                          <div 
                            key={group.id} 
                            className="bg-slate-900 rounded-lg p-3 border border-slate-700/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-slate-300">Group #{group.groupId}</span>
                              <span className="text-xs text-slate-500">{group.rounds} rounds</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-slate-500 block">Size</span>
                                <span className="text-white font-mono">{group.groupSize.toFixed(4)}"</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">ES</span>
                                <span className="text-white font-mono">{group.extremeSpread.toFixed(4)}"</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Vel ES</span>
                                <span className="text-white font-mono">{group.velocityEs} fps</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Vel SD</span>
                                <span className="text-white font-mono">{group.velocitySd} fps</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {session.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <p className="text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">Notes:</span> {session.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}