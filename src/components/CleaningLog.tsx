import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { Rifle } from '../types';

interface CleaningEntry {
  id: string;
  date: string;
  roundsSinceLast: string;
  notes: string;
}

interface CleaningLogMap {
  [rifleId: string]: CleaningEntry[];
}

interface CleaningLogProps {
  rifles: Rifle[];
}

export function CleaningLog({ rifles }: CleaningLogProps) {
  const [selectedRifleId, setSelectedRifleId] = useState('');
  const [logMap, setLogMap] = useState<CleaningLogMap>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formRounds, setFormRounds] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const entries = selectedRifleId ? (logMap[selectedRifleId] || []).slice().reverse() : [];

  const handleAdd = () => {
    if (!selectedRifleId || !formDate) return;
    const newEntry: CleaningEntry = {
      id: Date.now().toString(),
      date: formDate,
      roundsSinceLast: formRounds,
      notes: formNotes,
    };
    setLogMap(prev => ({
      ...prev,
      [selectedRifleId]: [...(prev[selectedRifleId] || []), newEntry],
    }));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRounds('');
    setFormNotes('');
    setIsAdding(false);
  };

  const handleDelete = (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    setLogMap(prev => ({
      ...prev,
      [selectedRifleId]: (prev[selectedRifleId] || []).filter(e => e.id !== entryId),
    }));
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month) - 1]} ${day}, ${year}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Cleaning Log</h2>

      <div className="flex items-end gap-4">
        <div className="space-y-2 flex-1 max-w-sm">
          <Label className="text-slate-400 text-xs uppercase tracking-widest">Select Rifle</Label>
          <Select value={selectedRifleId} onValueChange={v => { setSelectedRifleId(v); setIsAdding(false); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Choose a rifle…" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {rifles.length === 0
                ? <SelectItem value="_none" disabled className="text-slate-500">No rifles in inventory</SelectItem>
                : rifles.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-white">
                      {r.caliber} — {r.action}
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>
        {selectedRifleId && !isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Log Cleaning
          </Button>
        )}
      </div>

      {!selectedRifleId && (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">Select a rifle to view or log cleanings</p>
        </div>
      )}

      {selectedRifleId && isAdding && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-white">New Cleaning Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Date</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Rounds Since Last Cleaning</Label>
              <Input type="number" value={formRounds} onChange={e => setFormRounds(e.target.value)} placeholder="e.g. 200" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-400 text-xs">Notes</Label>
              <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Products used, bore condition, observations…" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">Save Entry</Button>
            <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
          </div>
        </div>
      )}

      {selectedRifleId && !isAdding && (
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-500 text-sm">No cleaning entries yet for this rifle</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded border" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
                      {formatDate(entry.date)}
                    </span>
                    {entry.roundsSinceLast && <span className="text-xs text-slate-500">{entry.roundsSinceLast} rounds since last</span>}
                    {entry.notes && <span className="text-xs text-slate-600 truncate max-w-xs hidden md:block">{entry.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); handleDelete(entry.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {expandedId === entry.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {expandedId === entry.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600 block mb-0.5 uppercase tracking-widest">Date</span>
                        <span className="text-white">{formatDate(entry.date)}</span>
                      </div>
                      {entry.roundsSinceLast && (
                        <div>
                          <span className="text-slate-600 block mb-0.5 uppercase tracking-widest">Rounds Since Last</span>
                          <span className="text-white">{entry.roundsSinceLast}</span>
                        </div>
                      )}
                    </div>
                    {entry.notes && (
                      <div className="text-xs">
                        <span className="text-slate-600 block mb-0.5 uppercase tracking-widest">Notes</span>
                        <p className="text-slate-300">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
