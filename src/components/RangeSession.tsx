import { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, Target, Calculator, Thermometer, Wind, Droplets, X, Upload, Download, Calendar, ChevronDown, ChevronUp, Pencil, Camera, Crosshair } from 'lucide-react';
import { RangeSession, RangeGroup, Rifle, Load, EnvironmentalConditions } from '../types';
import { generateId } from '../utils/id';
import { TargetAnalyzer } from './TargetAnalyzer';
import { format } from 'date-fns';

interface RangeSessionLoggerProps {
  sessions: RangeSession[];
  setSessions: (sessions: RangeSession[] | ((prev: RangeSession[]) => RangeSession[])) => void;
  rifles: Rifle[];
  loads: Load[];
  ammo?: any[];
  setAmmo?: (ammo: any[] | ((prev: any[]) => any[])) => void;
}

function uploadTargetPhoto(groupId: string, dataUrl: string) {
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    supabase.storage.from('range-photos')
      .upload(`targets/${groupId}.jpg`, bytes, { contentType: 'image/jpeg', upsert: true })
      .then((result: any) => { if (result.error) console.warn('Target photo upload:', result.error.message); });
  } catch (e) { console.warn('uploadTargetPhoto:', e); }
}





export function RangeSessionLogger({ sessions, setSessions, rifles, loads, ammo = [], setAmmo }: RangeSessionLoggerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRifleId, setSelectedRifleId] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [zeroDrift, setZeroDrift] = useState('');
  const [zeroDriftUnit, setZeroDriftUnit] = useState<'MOA' | 'MIL'>('MOA');
  const [ammoType, setAmmoType] = useState<'handload' | 'factory'>('handload');
  const [ammoUsageId, setAmmoUsageId] = useState('');
  const [shotsFired, setShotsFired] = useState('');
  
  // Environmental State
  const [envConditions, setEnvConditions] = useState<EnvironmentalConditions>({
    temperature: 0,
    windSpeed: 0,
    windDirection: '',
    humidity: 0,
    pressure: 29.92,
    altitude: 0,
  });

  const [groups, setGroups] = useState<RangeGroup[]>([]);
  const [nextGroupNumber, setNextGroupNumber] = useState(1);
  
  // Local state to hold raw velocity strings for inputs
  const [velocityInputs, setVelocityInputs] = useState<Record<string, string>>({});
  const [targetImages, setTargetImages] = useState<Record<string, string>>({});
  const [historyPhotoUrls, setHistoryPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!sessions || sessions.length === 0) return;
    const urls: Record<string, string> = {};
    sessions.forEach(s => {
      (s.groups || []).forEach(g => {
        const url = (g as any).targetPhotoUrl;
        if (url) urls[g.id] = url;
      });
    });
    setHistoryPhotoUrls(prev => ({ ...prev, ...urls }));
  }, [sessions.length]);
  const [targetAnalyses, setTargetAnalyses] = useState<Record<string, any>>({});
  const [analyzerGroupId, setAnalyzerGroupId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'logger' | 'history'>('logger');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const getRifleLabel = (rifleId: string) => {
    const rifle = rifles.find(r => r.id === rifleId);
    return rifle ? `${rifle.caliber} - ${rifle.action}` : 'Unknown Rifle';
  };

  const getLoadLabel = (loadId: string) => {
    const load = loads.find(l => l.id === loadId);
    return load ? `${load.bulletWeight}gr ${load.bulletName}` : 'Unknown Load';
  };

  const deleteSession = (id: string) => {
    setSessions((prev: RangeSession[]) => prev.filter((s: RangeSession) => s.id !== id));
  };

  const exportToCSV = () => {
    const rows: string[][] = [
      ['Date', 'Rifle', 'Load', 'Group #', 'Size (in)', 'ES (in)', 'MR (in)', 'Rounds', 'Vel ES (fps)', 'Vel SD (fps)', 'Notes'],
    ];
    sessions.forEach(session => {
      session.groups.forEach(group => {
        rows.push([
          format(new Date(session.sessionDate.slice(0,10) + 'T12:00:00'), 'yyyy-MM-dd'),
          getRifleLabel(session.rifleId),
          getLoadLabel(session.loadId),
          String(group.groupId),
          String(group.groupSize),
          String(group.extremeSpread),
          String(group.groupSd),
          String(group.rounds),
          String(group.velocityEs),
          String(group.velocitySd),
          session.notes,
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'range_sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addGroup = () => {
    const id = generateId();
    const newGroup: RangeGroup = {
      id,
      groupId: nextGroupNumber,
      groupSize: 0,
      extremeSpread: 0,
      groupSd: 0,
      rounds: 0,
      velocityEs: 0,
      velocitySd: 0,
    };
    setGroups([...groups, newGroup]);
    setNextGroupNumber(nextGroupNumber + 1);
    setVelocityInputs(prev => ({ ...prev, [id]: '' }));
  };

  const updateGroup = (id: string, field: keyof RangeGroup, value: string) => {
    setGroups(groups.map(g => 
      g.id === id ? { ...g, [field]: parseFloat(value) || 0 } : g
    ));
  };

  const handleVelocityInput = (id: string, value: string) => {
    setVelocityInputs(prev => ({ ...prev, [id]: value }));

    const velocities = value
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));

    let es = 0;
    let sd = 0;

    if (velocities.length > 1) {
      const min = Math.min(...velocities);
      const max = Math.max(...velocities);
      es = max - min;

      const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      const variance = velocities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (velocities.length - 1);
      sd = Math.sqrt(variance);
    }

    setGroups(groups.map(g => {
      if (g.id !== id) return g;
      const updated: any = { ...g, velocityEs: parseFloat(es.toFixed(1)), velocitySd: parseFloat(sd.toFixed(1)), rounds: velocities.length > 0 ? velocities.length : g.rounds };
      updated.velocities = velocities.length > 0 ? velocities : (g as any).velocities;
      return updated;
    }));
  };

  const handleVelocityFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    const processVelocitiesWithTimes = (values: number[], times: string[]) => {
      const pairs = values.map((v, i) => ({ v, t: times[i] || '' }))
        .filter(p => !isNaN(p.v) && p.v > 500 && p.v < 5000);
      if (pairs.length > 0) {
        const joined = pairs.map(p => p.v).join(', ');
        setVelocityInputs(prev => ({ ...prev, [id]: joined }));
        handleVelocityInput(id, joined);
        // Store timestamps on the group
        setGroups(prev => prev.map(g =>
          g.id === id ? { ...g, velocityTimes: pairs.map(p => p.t) } as any : g
        ));
      }
    };

    const processVelocities = (values: number[]) => {
      processVelocitiesWithTimes(values, []);
    };

    const findTimeColumn = (rows: any[][]): number => {
      const TIME_LABELS = ['time', 'timestamp', 'shot time', 'time (hh:mm:ss)', 'time of day'];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const cell = String(rows[r][c] ?? '').toLowerCase().trim();
          if (TIME_LABELS.some(l => cell === l || cell.includes(l))) return c;
        }
      }
      return -1;
    };

    // Find the column whose header exactly matches known velocity labels
    const findVelocityColumn = (rows: any[][]): number => {
      // Exact/strict labels — must be the whole cell content or contain fps units
      const EXACT = ['speed (fps)', 'velocity (fps)', 'speed(fps)', 'velocity(fps)', 'vel (fps)', 'muzzle velocity (fps)'];
      // Search ALL rows for a header (not just first 5 — some files have late headers)
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const cell = String(rows[r][c] ?? '').toLowerCase().trim();
          if (EXACT.some(l => cell === l || cell.includes(l))) return c;
        }
      }
      // Fallback: pick column where most values are in 500–5000 fps range
      const numCols = Math.max(...rows.map(r => r.length));
      const scores: number[] = Array(numCols).fill(0);
      rows.forEach(r => {
        for (let c = 0; c < r.length; c++) {
          const v = parseFloat(String(r[c] ?? ''));
          if (!isNaN(v) && v > 500 && v < 5000) scores[c]++;
        }
      });
      const best = scores.indexOf(Math.max(...scores));
      return scores[best] > 0 ? best : 1;
    };

    // Only keep rows where first cell is a positive number (shot number) — skips summary/header rows
    const isDataRow = (row: any[]) => {
      const first = row[0];
      if (first === null || first === undefined || first === '') return false;
      const n = parseFloat(String(first).trim());
      return !isNaN(n) && n > 0 && n < 100000;
    };

    if (file.name.endsWith('.csv')) {
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split('\n').map((l: string) => l.replace(/\r/g, '').trim()).filter(Boolean);
        const rows = lines.map((l: string) => l.split(',').map((c: string) => c.trim().replace(/^"|"$/g, '')));
        const col = findVelocityColumn(rows);
        const timeCol = findTimeColumn(rows);
        const dataRows = rows.filter(isDataRow);
        const velocities = dataRows.map(row => parseFloat(row[col]));
        const times = timeCol >= 0 ? dataRows.map(row => String(row[timeCol] ?? '')) : [];
        processVelocitiesWithTimes(velocities, times);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = utils.sheet_to_json(sheet, { header: 1 });
        const col = findVelocityColumn(rows);
        const timeCol = findTimeColumn(rows);
        const dataRows = rows.filter(isDataRow);
        const velocities = dataRows.map((row: any[]) => parseFloat(String(row[col] ?? '')));
        const times = timeCol >= 0 ? dataRows.map((row: any[]) => String(row[timeCol] ?? '')) : [];
        processVelocitiesWithTimes(velocities, times);
      };
      reader.readAsArrayBuffer(file);
    }

    e.target.value = '';
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    setVelocityInputs(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const startEditSession = (session: RangeSession) => {
    setEditingSessionId(session.id);
    setSelectedRifleId(session.rifleId);
    setSelectedLoadId(session.loadId);
    setSessionDate(session.sessionDate.slice(0, 10));
    setSessionNotes(session.notes || '');
    setZeroDrift((session as any).zeroDrift || '');
    setZeroDriftUnit((session as any).zeroDriftUnit || 'MOA');
    setAmmoType((session as any).ammoType || 'handload');
    setAmmoUsageId((session as any).ammoUsageId || '');
    setShotsFired((session as any).shotsFired ? String((session as any).shotsFired) : '');
    setEnvConditions(session.conditions || {
      temperature: 0, windSpeed: 0, windDirection: '', humidity: 0, pressure: 29.92, altitude: 0,
    });
    setGroups(session.groups);
    setNextGroupNumber(Math.max(...session.groups.map(g => g.groupId), 0) + 1);
    // Restore velocity inputs from stored velocities if available
    const inputs: Record<string, string> = {};
    session.groups.forEach(g => {
      const vels = (g as any).velocities as number[] | undefined;
      inputs[g.id] = vels && vels.length > 0 ? vels.join(', ') : '';
    });
    setVelocityInputs(inputs);
    setIsAdding(true);
    setActiveView('logger');
    setExpandedSessionId(null);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingSessionId(null);
    setSelectedRifleId('');
    setSelectedLoadId('');
    setSessionNotes('');
    setZeroDrift('');
    setZeroDriftUnit('MOA');
    setAmmoType('handload');
    setAmmoUsageId('');
    setShotsFired('');
    setSessionDate(new Date().toISOString().slice(0, 10));
    setEnvConditions({ temperature: 0, windSpeed: 0, windDirection: '', humidity: 0, pressure: 29.92, altitude: 0 });
    setGroups([]);
    setNextGroupNumber(1);
    setVelocityInputs({});
  };

  const saveSession = () => {
    if (!selectedRifleId) {
      alert('Please select a rifle before saving.');
      return;
    }
    if (ammoType === 'handload' && !selectedLoadId) {
      alert('Please select a load recipe for handload sessions.');
      return;
    }

    // Attach individual velocity arrays to groups before saving
    const groupsWithVelocities = groups.map(g => {
      const raw = velocityInputs[g.id] || '';
      const vels = raw.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 0);
      return { ...(g as any), velocities: vels.length > 0 ? vels : ((g as any).velocities || undefined) };
    });

    if (editingSessionId) {
      setSessions((prev: RangeSession[]) => prev.map((s: RangeSession) =>
        s.id === editingSessionId
          ? {
              ...s,
              rifleId: selectedRifleId,
              loadId: selectedLoadId,
              sessionDate: new Date(sessionDate + 'T12:00:00').toISOString(),
              notes: sessionNotes,
              zeroDrift: zeroDrift || undefined,
              zeroDriftUnit: zeroDrift ? zeroDriftUnit : undefined,
              ammoType: ammoType,
              ammoUsageId: ammoUsageId || undefined,
              shotsFired: groupsWithVelocities.reduce((s: number, g: any) => s + (g.rounds || 0), 0) || undefined,
              conditions: envConditions,
              groups: groupsWithVelocities,
            }
          : s
      ));
    } else {
      const newSession = {
        id: generateId(),
        rifleId: selectedRifleId,
        loadId: selectedLoadId,
        sessionDate: new Date(sessionDate + 'T12:00:00').toISOString(),
        notes: sessionNotes,
        zeroDrift: zeroDrift || undefined,
        zeroDriftUnit: zeroDrift ? zeroDriftUnit : undefined,
        ammoType: ammoType,
        ammoUsageId: ammoUsageId || undefined,
        shotsFired: groupsWithVelocities.reduce((s: number, g: any) => s + (g.rounds || 0), 0) || undefined,
        conditions: envConditions,
        groups: groupsWithVelocities,
        createdAt: new Date().toISOString(),
      } as any;
      setSessions((prev: RangeSession[]) => [newSession, ...prev]);
    }

    // Deduct shots fired from ammo inventory (only on new session, not edit)
    if (!editingSessionId && ammoUsageId && ammoUsageId !== '_none' && shotsFired && setAmmo) {
      const shots = parseInt(shotsFired);
      if (!isNaN(shots) && shots > 0) {
        setAmmo(prev => prev.map(a => a.id === ammoUsageId ? { ...a, quantity: Math.max(0, a.quantity - shots) } : a));
      }
    }

    cancelForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Range Session</h2>
          <div className="flex gap-1 bg-slate-900 rounded-md p-1 border border-slate-800">
            <button
              onClick={() => setActiveView('logger')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'logger' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >Logger</button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'history' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >History</button>
          </div>
        </div>

        {activeView === 'history' && (
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-1.5 text-xs border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <Download className="w-3 h-3" />Export CSV
          </button>
        )}
      </div>

      {activeView === 'history' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
              <p className="text-sm">No sessions recorded yet.</p>
            </div>
          ) : (() => {
            // Group sessions by date key (yyyy-MM-dd)
            const grouped: Record<string, RangeSession[]> = {};
            [...sessions]
              .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
              .forEach(session => {
                const dateKey = session.sessionDate.slice(0, 10);
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(session);
              });

            return Object.entries(grouped).map(([dateKey, dateSessions]) => {
              const isDateExpanded = expandedDateKey === dateKey;
              const totalGroups = dateSessions.reduce((sum, s) => sum + s.groups.length, 0);

              return (
                <div key={dateKey} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                  {/* Date header row */}
                  <button
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors text-left"
                    onClick={() => setExpandedDateKey(isDateExpanded ? null : dateKey)}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-white">
                        {format(new Date(dateKey + 'T12:00:00'), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{dateSessions.length} {dateSessions.length === 1 ? 'session' : 'sessions'} · {totalGroups} {totalGroups === 1 ? 'group' : 'groups'}</span>
                      {isDateExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>

                  {/* Session cards within this date */}
                  {isDateExpanded && (
                    <div className="border-t border-slate-800 px-3 py-3 space-y-2">
                      {dateSessions.map(session => (
                        <div key={session.id} className="bg-slate-800 border border-slate-700 rounded-md overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700 transition-colors text-left"
                            onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                          >
                            <div className="space-y-1.5">
                              <div className="text-sm font-semibold text-white">{getRifleLabel(session.rifleId)}</div>
                              {(() => {
                                const load = loads.find(l => l.id === session.loadId);
                                if (!load) return null;
                                return (
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    {load.charge > 0 && (
                                      <span className="flex items-center gap-1">
                                        <span className="text-slate-500">Charge</span>
                                        <span className="text-amber-400 font-mono font-semibold">{load.charge}gr</span>
                                      </span>
                                    )}
                                    {load.bulletId && (
                                      <span className="flex items-center gap-1">
                                        <span className="text-slate-500">Bullet</span>
                                        <span className="text-slate-300">{load.bulletId}</span>
                                      </span>
                                    )}
                                    {load.powderId && (
                                      <span className="flex items-center gap-1">
                                        <span className="text-slate-500">Powder</span>
                                        <span className="text-slate-300">{load.powderId}</span>
                                      </span>
                                    )}
                                    {load.caseId && (
                                      <span className="flex items-center gap-1">
                                        <span className="text-slate-500">Brass</span>
                                        <span className="text-slate-300">{load.caseId}</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{session.groups.length} {session.groups.length === 1 ? 'group' : 'groups'}</span>
                              <button onClick={(e) => { e.stopPropagation(); startEditSession(session); }} className="p-1 text-slate-500 hover:text-amber-400 transition-colors" title="Edit session">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {expandedSessionId === session.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                            </div>
                          </button>

                          {expandedSessionId === session.id && (
                            <div className="px-3 pb-3 border-t border-slate-700">
                              {session.conditions && (
                                <div className="py-2.5 mb-2">
                                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                    <span><Thermometer className="w-3 h-3 inline mr-1 text-orange-400" />{session.conditions.temperature}°F</span>
                                    <span><Wind className="w-3 h-3 inline mr-1 text-blue-400" />{session.conditions.windSpeed} mph {session.conditions.windDirection}</span>
                                    <span><Droplets className="w-3 h-3 inline mr-1 text-cyan-400" />{session.conditions.humidity}%</span>
                                    {session.conditions.pressure && <span>Pressure: {session.conditions.pressure} inHg</span>}
                                    {(session.conditions as any).altitude > 0 && <span>Alt: {(session.conditions as any).altitude} ft</span>}
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                {session.groups.map(group => (
                                  <div key={group.id} className="bg-slate-900 rounded p-3">
                                    <div className="flex justify-between mb-2">
                                      <span className="text-xs font-semibold text-slate-300">Group #{group.groupId}</span>
                                      <span className="text-xs text-slate-500">{group.rounds} rounds</span>
                                    </div>
                                    {(historyPhotoUrls[group.id] || targetImages[group.id]) && (
                                      <div className="mb-2">
                                        <img
                                          src={historyPhotoUrls[group.id] || targetImages[group.id]}
                                          alt={`Group ${group.groupId} target`}
                                          className="w-full max-h-48 object-contain rounded border border-slate-700 bg-slate-950"
                                        />
                                      </div>
                                    )}
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                      <div><span className="text-slate-500 block">Size</span><span className="text-white font-mono">{group.groupSize.toFixed(4)}"</span></div>
<div><span className="text-slate-500 block">Vel ES</span><span className="text-white font-mono">{group.velocityEs} fps</span></div>
                                      <div><span className="text-slate-500 block">Vel SD</span><span className="text-white font-mono">{group.velocitySd} fps</span></div>
                                    </div>
                                  </div>
                                ))}
                                {(session as any).zeroDrift && (
                                  <p className="text-xs text-slate-400"><span className="text-slate-300 font-medium">Zero Drift:</span> {(session as any).zeroDrift} {(session as any).zeroDriftUnit}</p>
                                )}
                                {session.notes && <p className="text-xs text-slate-400 pt-2 border-t border-slate-700"><span className="text-slate-300 font-medium">Notes:</span> {session.notes}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {analyzerGroupId != null && (() => {
        const _gid: string = analyzerGroupId;
        if (!targetImages[_gid]) return null;
        return (
          <TargetAnalyzer
            imageData={targetImages[_gid]}
            groupId={_gid}
            distance={(groups.find((g: any) => g.id === _gid) as any)?.distance || ''}
            onSave={(analysis: any, annotatedImage: string) => {
              setTargetAnalyses((prev: any) => ({ ...prev, [_gid]: analysis }));
              const _gidCopy = _gid;
              setTargetImages((prev: any) => ({ ...prev, [_gidCopy]: annotatedImage }));
              supabase.storage.from('range-photos')
                .upload(`targets/${_gidCopy}.jpg`, (() => {
                  const base64 = annotatedImage.split(',')[1];
                  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                })(), { contentType: 'image/jpeg', upsert: true })
                .then(() => {
                  const { data } = supabase.storage.from('range-photos').getPublicUrl(`targets/${_gidCopy}.jpg`);
                  setGroups((prev: any) => prev.map((g: any) =>
                    g.id === _gidCopy ? { ...g, targetPhotoUrl: data.publicUrl } : g
                  ));
                });
              supabase.storage.from('range-photos')
                .upload(`targets/${_gid}.jpg`, (() => {
                  const base64 = annotatedImage.split(',')[1];
                  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                })(), { contentType: 'image/jpeg', upsert: true })
                .then(() => {
                  const { data } = supabase.storage.from('range-photos').getPublicUrl(`targets/${_gid}.jpg`);
                  const url = data.publicUrl;
                  setGroups((prev: any) => prev.map((g: any) =>
                    g.id === _gid ? { ...g, targetPhotoUrl: url } : g
                  ));
                });
              uploadTargetPhoto(_gid, annotatedImage);
              setGroups((prev: any) => prev.map((g: any) => {
                if (g.id !== _gid) return g;
                return {
                  ...g,
                  distance: analysis.distance || g.distance || '',
                  groupSize: analysis.groupSize || g.groupSize,
                  groupSizeMoa: analysis.groupSizeMoa ?? g.groupSizeMoa ?? 0,
                  groupSd: analysis.meanRadius || g.groupSd,
                };
              }));
              setAnalyzerGroupId(null);
            }}
            onClose={() => setAnalyzerGroupId(null)}
          />
        );
      })()}
      {activeView === 'logger' && (
        <>
        {!isAdding && (
          <div
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
          >
            <Plus className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">New Range Session</p>
            <p className="text-slate-600 text-sm mt-1">Click to log a session</p>
          </div>
        )}
        {isAdding && (<div className="space-y-4 max-w-2xl">

          {/* Session Setup Card */}
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Session Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Rifle | Ammo Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Rifle</Label>
                  <Select value={selectedRifleId} onValueChange={setSelectedRifleId}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Select rifle" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {rifles.map(r => (
                        <SelectItem key={r.id} value={r.id} className="text-white">{r.caliber} - {r.action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Ammo Type</Label>
                  <div className="flex gap-1 bg-slate-950 border border-slate-700 rounded-md p-1 h-9 items-center">
                    {(['handload', 'factory'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => { setAmmoType(t); setSelectedLoadId(''); setAmmoUsageId(''); }}
                        className={`flex-1 py-0.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${ammoType === t ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
                        style={ammoType === t ? { backgroundColor: '#f59e0b' } : {}}>
                        {t === 'handload' ? 'Handload' : 'Factory'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Row 2: Date | Load Recipe/Factory Ammo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Date</Label>
                  <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" style={{ colorScheme: "dark" }} />
                </div>
                {ammoType === 'handload' ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Load Recipe</Label>
                    <Select value={selectedLoadId} onValueChange={setSelectedLoadId}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Select load" /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 max-h-60 overflow-y-auto" position="popper" sideOffset={4}>
                        {loads.map(l => (
                          <SelectItem key={l.id} value={l.id} className="text-white">
                            {l.charge}gr — {l.bulletId || ''} {l.powderId || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Factory Ammo</Label>
                    <Select value={ammoUsageId} onValueChange={setAmmoUsageId}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Select ammo…" /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {ammo.filter((a: any) => a.type === 'factory').length === 0
                          ? <SelectItem value="_none" disabled className="text-slate-500">No factory ammo in inventory</SelectItem>
                          : ammo.filter((a: any) => a.type === 'factory').map((a: any) => (
                              <SelectItem key={a.id} value={a.id} className="text-white">
                                {a.brand}{a.name ? ` ${a.name}` : ''} — {a.caliber} ({a.quantity} rds)
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {/* Row 3: Shots Fired (auto) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Shots Fired <span className="text-slate-600 font-normal normal-case">(auto-updated from groups)</span></Label>
                  <Input readOnly value={groups.reduce((s, g) => s + (g.rounds || 0), 0) || ''}
                    placeholder="auto" className="bg-slate-950 border-slate-700 text-slate-400 h-9 cursor-default" />
                </div>
              </div>

              {/* Conditions */}
              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Wind className="w-3 h-3 text-blue-400" /> Conditions
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center gap-1 h-4"><Thermometer className="w-3 h-3" /> Temp (°F)</Label>
                    <Input type="number" value={envConditions.temperature || ''} onChange={(e) => setEnvConditions({ ...envConditions, temperature: parseFloat(e.target.value) || 0 })} className="bg-slate-950 border-slate-700 text-white h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center gap-1 h-4"><Droplets className="w-3 h-3" /> Humidity (%)</Label>
                    <Input type="number" value={envConditions.humidity || ''} onChange={(e) => setEnvConditions({ ...envConditions, humidity: parseFloat(e.target.value) || 0 })} className="bg-slate-950 border-slate-700 text-white h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center h-4">Wind (mph)</Label>
                    <Input type="number" step="0.1" value={envConditions.windSpeed || ''} onChange={(e) => setEnvConditions({ ...envConditions, windSpeed: parseFloat(e.target.value) || 0 })} className="bg-slate-950 border-slate-700 text-white h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center h-4">Direction</Label>
                    <Select value={envConditions.windDirection} onValueChange={(val) => setEnvConditions({ ...envConditions, windDirection: val })}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Dir" /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="Calm">Calm</SelectItem>
                        <SelectItem value="12 o'clock">12 o'clock</SelectItem>
                        <SelectItem value="1 o'clock">1 o'clock</SelectItem>
                        <SelectItem value="2 o'clock">2 o'clock</SelectItem>
                        <SelectItem value="3 o'clock">3 o'clock</SelectItem>
                        <SelectItem value="4 o'clock">4 o'clock</SelectItem>
                        <SelectItem value="5 o'clock">5 o'clock</SelectItem>
                        <SelectItem value="6 o'clock">6 o'clock</SelectItem>
                        <SelectItem value="7 o'clock">7 o'clock</SelectItem>
                        <SelectItem value="8 o'clock">8 o'clock</SelectItem>
                        <SelectItem value="9 o'clock">9 o'clock</SelectItem>
                        <SelectItem value="10 o'clock">10 o'clock</SelectItem>
                        <SelectItem value="11 o'clock">11 o'clock</SelectItem>
                        <SelectItem value="Variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center h-4">Pressure (inHg)</Label>
                    <Input type="number" step="0.01" value={envConditions.pressure || ''} onChange={(e) => setEnvConditions({ ...envConditions, pressure: parseFloat(e.target.value) || 29.92 })} className="bg-slate-950 border-slate-700 text-white h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 flex items-center h-4">Altitude (ft)</Label>
                    <Input type="number" step="1" value={(envConditions as any).altitude || ''} onChange={(e) => setEnvConditions({ ...envConditions, altitude: parseFloat(e.target.value) || 0 } as any)} className="bg-slate-950 border-slate-700 text-white h-9" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Notes & Zero Drift & Ammo */}
              <div className="border-t border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Session Notes</Label>
                  <Input placeholder="Mirage, light conditions..." value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Zero Drift</Label>
                  <div className="flex gap-2">
                    <Input type="number" step="0.01" value={zeroDrift} onChange={(e) => setZeroDrift(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9 flex-1" />
                    <div className="flex gap-1 bg-slate-950 border border-slate-700 rounded-md p-1">
                      {(['MOA', 'MIL'] as const).map(u => (
                        <button key={u} type="button" onClick={() => setZeroDriftUnit(u)}
                          className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-widest transition-colors ${zeroDriftUnit === u ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
                          style={zeroDriftUnit === u ? { backgroundColor: '#f59e0b' } : {}}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Groups */}
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Shooting Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length === 0 ? (
                <div onClick={addGroup}
                  className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 bg-slate-950 rounded-lg cursor-pointer hover:border-amber-700 hover:bg-slate-900 transition-colors">
                  <Plus className="w-5 h-5 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Click to add a group</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">Group #{group.groupId}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeGroup(group.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-slate-400">Distance (yds)</Label>
                          <Input
                            value={(group as any).distance || ''}
                            onChange={(e) => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, distance: e.target.value } as any : g))}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Shots Fired</Label>
                          <Input
                            type="number"
                            value={group.rounds || ''}
                            onChange={(e) => updateGroup(group.id, 'rounds', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Size (in)</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={group.groupSize || ''}
                            onChange={(e) => updateGroup(group.id, 'groupSize', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Size (MOA)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={(group as any).groupSizeMoa || ''}
                            onChange={(e) => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, groupSizeMoa: parseFloat(e.target.value) || 0 } as any : g))}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Mean Radius (in)</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={group.groupSd || ''}
                            onChange={(e) => updateGroup(group.id, 'groupSd', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-3 h-3 text-amber-400" />
                            <Label className="text-xs text-slate-400">Velocities (enter manually or upload from a CSV or Excel file)</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-700/50 bg-amber-900/10 hover:bg-amber-900/20 px-2.5 py-1 rounded-md transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Velocity Data</span>
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => handleVelocityFileUpload(group.id, e)}
                              />
                            </label>
                            {!targetImages[group.id] && (
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-700/50 bg-amber-900/10 hover:bg-amber-900/20 px-2.5 py-1 rounded-md transition-colors">
                                <Camera className="w-3.5 h-3.5" />
                                <span>Add Target Photo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const d = ev.target?.result as string;
                                    setTargetImages(prev => ({ ...prev, [group.id]: d }));
                                    uploadTargetPhoto(group.id, d);
                                  };
                                  reader.readAsDataURL(file);
                                }} />
                              </label>
                            )}
                          </div>
                        </div>
                        <Input 
                          placeholder="e.g. 2750, 2755, 2748"
                          value={velocityInputs[group.id] || ''}
                          onChange={(e) => handleVelocityInput(group.id, e.target.value)}
                          className="bg-slate-950 border-slate-700 text-white font-mono text-xs h-8"
                        />
                        {(() => {
                          const raw = velocityInputs[group.id] || '';
                          const vals = raw.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 0);
                          if (vals.length < 2) return (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-slate-950 border border-slate-800 rounded p-1.5 text-center">
                                <div className="text-[10px] text-slate-500 uppercase">ES</div>
                                <div className="text-sm font-mono text-blue-400">{group.velocityEs}</div>
                              </div>
                              <div className="bg-slate-950 border border-slate-800 rounded p-1.5 text-center">
                                <div className="text-[10px] text-slate-500 uppercase">SD</div>
                                <div className="text-sm font-mono text-amber-400">{group.velocitySd}</div>
                              </div>
                            </div>
                          );
                          const rawMin = Math.min(...vals);
                          const rawMax = Math.max(...vals);
                          const mean = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
                          // Expand axis to nice 2-fps boundaries with padding
                          const axisMin = Math.floor(rawMin / 2) * 2 - 4;
                          const axisMax = Math.ceil(rawMax / 2) * 2 + 4;
                          const axisRange = axisMax - axisMin;
                          const dotR = 4;
                          const pad = dotR + 4;
                          const plotH = 56;
                          // Scale pixels per fps so the plot fills ~560px minimum
                          // Use at least 8px per fps, giving good spread for tight groups
                          const pxPerFps = Math.max(8, 560 / Math.max(axisRange, 1));
                          const innerW = Math.max(320, axisRange * pxPerFps);
                          const plotW = innerW + pad * 2;
                          // toX maps [axisMin, axisMax] exactly to [pad, pad+innerW]
                          const toX = (v: number) => pad + ((v - axisMin) / axisRange) * innerW;
                          // Tick interval: pick a round number so we get ~6-10 ticks
                          const rawTickInterval = axisRange / 8;
                          const tickInterval = rawTickInterval <= 2 ? 2 : rawTickInterval <= 5 ? 5 : rawTickInterval <= 10 ? 10 : 20;
                          const ticks: number[] = [];
                          for (let t = Math.ceil(axisMin / tickInterval) * tickInterval; t <= axisMax; t += tickInterval) ticks.push(t);
                          return (
                            <div className="mt-2 bg-slate-950 border border-slate-800 rounded p-2 inline-block max-w-full">
                              {/* ES / SD */}
                              <div className="flex gap-3 text-[10px] font-mono mb-2">
                                <span><span className="text-slate-500 uppercase">ES </span><span className="text-blue-400">{group.velocityEs} fps</span></span>
                                <span><span className="text-slate-500 uppercase">SD </span><span className="text-amber-400">{group.velocitySd} fps</span></span>
                                <span className="text-slate-600 ml-auto">{vals.length} shots</span>
                              </div>
                              {/* Dot plot SVG */}
                              <div className="overflow-x-auto">
                                <svg width={plotW} height={plotH + 46} style={{ display: 'block' }}>
                                  <defs>
                                    <clipPath id={`clip-${group.id}`}>
                                      <rect x={pad} y={0} width={innerW} height={plotH} />
                                    </clipPath>
                                  </defs>
                                  {/* Axis line */}
                                  <line x1={pad} y1={plotH / 2} x2={pad + innerW} y2={plotH / 2} stroke="#334155" strokeWidth="1" />
                                  {/* Tick marks every 2fps */}
                                  {ticks.map((t: number) => (
                                    <line key={t} x1={toX(t)} y1={plotH / 2 - 3} x2={toX(t)} y2={plotH / 2 + 3} stroke="#334155" strokeWidth="1" />
                                  ))}
                                  {/* Mean line */}
                                  <line x1={toX(mean)} y1={6} x2={toX(mean)} y2={plotH - 6} stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                                  {/* ±1 SD band */}
                                  <rect
                                    x={toX(mean - group.velocitySd)}
                                    y={plotH / 2 - 10}
                                    width={toX(mean + group.velocitySd) - toX(mean - group.velocitySd)}
                                    height={20}
                                    fill="#d97706"
                                    opacity="0.1"
                                    clipPath={`url(#clip-${group.id})`}
                                  />
                                  {/* Dots — clipped so they never escape */}
                                  <g clipPath={`url(#clip-${group.id})`}>
                                    {vals.map((v: number, i: number) => (
                                      <circle key={i} cx={toX(v)} cy={plotH / 2} r={dotR} fill="#d97706" opacity="0.9">
                                        <title>{v} fps</title>
                                      </circle>
                                    ))}
                                  </g>
                                  {/* X axis tick labels every 2fps */}
                                  {ticks.map((t: number) => (
                                    <text key={t} x={toX(t)} y={plotH + 12} textAnchor="middle" fontSize="7" fontFamily="JetBrains Mono, monospace" fill="#475569">{t}</text>
                                  ))}
                                  {/* X axis unit label */}
                                  <text x={plotW / 2} y={plotH + 26} textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono, monospace" fill="#334155">Velocity (fps)</text>
                                  {/* SD band legend */}
                                  <rect x={pad} y={plotH + 32} width={10} height={8} fill="#d97706" opacity="0.25" rx="1" />
                                  <text x={pad + 13} y={plotH + 40} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="#475569">± 1 SD band</text>
                                  {/* Mean line legend */}
                                  <line x1={pad + 70} y1={plotH + 36} x2={pad + 80} y2={plotH + 36} stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                                  <text x={pad + 83} y={plotH + 40} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="#475569">mean</text>
                                </svg>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Target photo */}
                      <div className="pt-2 border-t border-slate-800">
                        {targetImages[group.id] ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 uppercase tracking-widest">Target Photo</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors">
                                  <Camera className="w-3.5 h-3.5" />Replace
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const d2 = ev.target?.result as string;
                                        setTargetImages((prev: any) => ({ ...prev, [group.id]: d2 }));
                                        uploadTargetPhoto(group.id, d2);
                                        setTargetAnalyses((prev: any) => { const n = { ...prev }; delete n[group.id]; return n; });
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                                <button
                                  onClick={() => setAnalyzerGroupId(group.id)}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 px-2.5 py-1 rounded-md transition-colors"
                                >
                                  <Crosshair className="w-3.5 h-3.5" />Analyze
                                </button>
                              </div>
                            </div>
                            <div className="inline-block">
                              <img
                                src={targetImages[group.id]}
                                alt="Target"
                                style={{ width: 'auto', height: 'auto', maxWidth: '400px', maxHeight: '400px' }}
                                className="object-contain rounded-lg border border-slate-700 bg-slate-950 block"
                              />
                            </div>
                            {targetAnalyses[group.id] && (
                              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-xs space-y-1">
                                {targetAnalyses[group.id].distance && (
                                  <div className="text-amber-400 font-semibold mb-1">@ {targetAnalyses[group.id].distance}</div>
                                )}
                                {[
                                  { label: 'Group Size', inch: targetAnalyses[group.id].groupSize, moa: targetAnalyses[group.id].groupSizeMoa },
                                  { label: 'Mean Radius', inch: targetAnalyses[group.id].meanRadius, moa: targetAnalyses[group.id].meanRadiusMoa },
                                  { label: 'Width', inch: targetAnalyses[group.id].width, moa: null },
                                  { label: 'Height', inch: targetAnalyses[group.id].height, moa: null },
                                ].map(({ label, inch, moa }: any) => (
                                  <div key={label} className="flex justify-between items-center">
                                    <span className="text-slate-500">{label}</span>
                                    <div className="flex items-center gap-2">
                                      {moa !== null && moa !== undefined && <span className="text-slate-400 font-mono">{moa} MOA</span>}
                                      <span className="text-white font-mono">{inch}"</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" size="lg">
              <X className="mr-2 h-5 w-5" />Cancel
            </Button>
            <Button onClick={saveSession} className="bg-amber-600 hover:bg-amber-500 text-white sm:px-8" size="lg">
              <Save className="mr-2 h-5 w-5" />Save Session
            </Button>
          </div>
        </div>)}
        </>
      )}
    </div>
  );
}