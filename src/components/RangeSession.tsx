import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Save, Target, Calculator, Thermometer, Wind, Droplets } from 'lucide-react';
import { RangeSession, RangeGroup, Rifle, Load, EnvironmentalConditions } from '../types';
import { generateId } from '../utils/id';

interface RangeSessionLoggerProps {
  sessions: RangeSession[];
  setSessions: (sessions: RangeSession[] | ((prev: RangeSession[]) => RangeSession[])) => void;
  rifles: Rifle[];
  loads: Load[];
}

export function RangeSessionLogger({ sessions, setSessions, rifles, loads }: RangeSessionLoggerProps) {
  const [selectedRifleId, setSelectedRifleId] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Environmental State
  const [envConditions, setEnvConditions] = useState<EnvironmentalConditions>({
    temperature: 0,
    windSpeed: 0,
    windDirection: '',
    humidity: 0,
    pressure: 29.92, // Default standard pressure
  });

  const [groups, setGroups] = useState<RangeGroup[]>([]);
  const [nextGroupNumber, setNextGroupNumber] = useState(1);
  
  // Local state to hold raw velocity strings for inputs
  const [velocityInputs, setVelocityInputs] = useState<Record<string, string>>({});

  const addGroup = () => {
    const id = generateId();
    const newGroup: RangeGroup = {
      id,
      groupId: nextGroupNumber,
      groupSize: 0,
      extremeSpread: 0,
      groupSd: 0,
      rounds: 5,
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

    setGroups(groups.map(g => 
      g.id === id ? { ...g, velocityEs: parseFloat(es.toFixed(1)), velocitySd: parseFloat(sd.toFixed(1)) } : g
    ));
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    setVelocityInputs(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const saveSession = () => {
    if (!selectedRifleId || !selectedLoadId) {
      alert('Please select a rifle and load before saving.');
      return;
    }

    const newSession: RangeSession = {
      id: generateId(),
      rifleId: selectedRifleId,
      loadId: selectedLoadId,
      sessionDate: new Date().toISOString(),
      notes: sessionNotes,
      conditions: envConditions, // Save environmental data
      groups: groups,
      createdAt: new Date().toISOString(),
    };

    setSessions([newSession, ...sessions]);
    
    // Reset form
    setSelectedRifleId('');
    setSelectedLoadId('');
    setSessionNotes('');
    setEnvConditions({
      temperature: 0,
      windSpeed: 0,
      windDirection: '',
      humidity: 0,
      pressure: 29.92,
    });
    setGroups([]);
    setNextGroupNumber(1);
    setVelocityInputs({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="text-slate-400" />
        <h2 className="text-2xl font-bold text-white">Range Session Logger</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Setup & Environment */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader>
              <CardTitle className="text-white">Equipment</CardTitle>
              <CardDescription className="text-slate-400">Select rifle and load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Rifle</Label>
                <Select value={selectedRifleId} onValueChange={setSelectedRifleId}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select rifle" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {rifles.map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-white">
                        {r.caliber} - {r.action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Load</Label>
                <Select value={selectedLoadId} onValueChange={setSelectedLoadId}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select load" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {loads.map(l => (
                      <SelectItem key={l.id} value={l.id} className="text-white">
                        {l.charge}gr - {l.oal}" OAL
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                Conditions
              </CardTitle>
              <CardDescription className="text-slate-400">Log environment data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> Temp (°F)
                  </Label>
                  <Input 
                    type="number" 
                    value={envConditions.temperature || ''} 
                    onChange={(e) => setEnvConditions({ ...envConditions, temperature: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-700 text-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Humidity (%)
                  </Label>
                  <Input 
                    type="number" 
                    value={envConditions.humidity || ''} 
                    onChange={(e) => setEnvConditions({ ...envConditions, humidity: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-700 text-white h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Wind (mph)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={envConditions.windSpeed || ''} 
                    onChange={(e) => setEnvConditions({ ...envConditions, windSpeed: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-700 text-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Direction</Label>
                  <Select 
                    value={envConditions.windDirection} 
                    onValueChange={(val) => setEnvConditions({ ...envConditions, windDirection: val })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9">
                      <SelectValue placeholder="Dir" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="Calm">Calm</SelectItem>
                      <SelectItem value="N">N</SelectItem>
                      <SelectItem value="NE">NE</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="SE">SE</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="SW">SW</SelectItem>
                      <SelectItem value="W">W</SelectItem>
                      <SelectItem value="NW">NW</SelectItem>
                      <SelectItem value="Variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Pressure (inHg)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={envConditions.pressure || ''} 
                  onChange={(e) => setEnvConditions({ ...envConditions, pressure: parseFloat(e.target.value) || 29.92 })}
                  className="bg-slate-900 border-slate-700 text-white h-9"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label className="text-slate-300">Session Notes</Label>
            <Input 
              placeholder="Mirage, light conditions..." 
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Right Column: Groups */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Shooting Groups</CardTitle>
                  <CardDescription className="text-slate-400">
                    Log performance data
                  </CardDescription>
                </div>
                <Button onClick={addGroup} className="bg-slate-700 hover:bg-slate-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                  No groups logged yet. Click "Add Group" to start.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
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
                          <Label className="text-xs text-slate-400">ES (in)</Label>
                          <Input 
                            type="number" 
                            step="0.0001"
                            value={group.extremeSpread || ''}
                            onChange={(e) => updateGroup(group.id, 'extremeSpread', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Rounds</Label>
                          <Input 
                            type="number" 
                            value={group.rounds || ''}
                            onChange={(e) => updateGroup(group.id, 'rounds', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">MR (in)</Label>
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
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="w-3 h-3 text-amber-400" />
                          <Label className="text-xs text-slate-400">Velocities (comma separated)</Label>
                        </div>
                        <Input 
                          placeholder="e.g. 2750, 2755, 2748"
                          value={velocityInputs[group.id] || ''}
                          onChange={(e) => handleVelocityInput(group.id, e.target.value)}
                          className="bg-slate-950 border-slate-700 text-white font-mono text-xs h-8"
                        />
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {groups.length > 0 && (
            <div className="flex justify-end">
              <Button 
                onClick={saveSession} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}