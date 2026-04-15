import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Edit, Save, X, Gauge } from 'lucide-react';
import { Rifle } from '../types';

type TorqueUnit = 'in-lbs' | 'ft-lbs' | 'Nm';

interface TorqueSpec {
  id: string;
  component: string;
  location: string;
  torqueValue: string;
  unit: TorqueUnit;
  notes: string;
}

interface TorqueCard {
  rifleId: string;
  specs: TorqueSpec[];
}

const COMPONENT_PRESETS = [
  'Scope Ring Front',
  'Scope Ring Rear',
  'Scope Base Front',
  'Scope Base Rear',
  'Scope Mount',
  'Picatinny Screw Front',
  'Picatinny Screw Rear',
  'Chassis Action Screw Front',
  'Chassis Action Screw Rear',
  'Suppressor Mount',
  'Muzzle Brake',
  'Other',
];

interface TorqueLogProps {
  rifles: Rifle[];
}

export function TorqueLog({ rifles }: TorqueLogProps) {
  const [cards, setCards] = useState<TorqueCard[]>([]);
  const [selectedRifleId, setSelectedRifleId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formComponent, setFormComponent] = useState('');
  const [formCustomComponent, setFormCustomComponent] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTorque, setFormTorque] = useState('');
  const [formUnit, setFormUnit] = useState<TorqueUnit>('in-lbs');
  const [formNotes, setFormNotes] = useState('');

  const selectedRifle = rifles.find(r => r.id === selectedRifleId);
  const currentCard = cards.find(c => c.rifleId === selectedRifleId);
  const specs = currentCard?.specs || [];

  const resetForm = () => {
    setFormComponent(''); setFormCustomComponent('');
    setFormLocation(''); setFormTorque('');
    setFormUnit('in-lbs'); setFormNotes('');
    setIsAdding(false); setEditingId(null);
  };

  const getComponentName = () => formComponent === 'Other' ? formCustomComponent : formComponent;

  const handleSave = () => {
    const name = getComponentName();
    if (!name || !formTorque) return;
    const spec: TorqueSpec = {
      id: editingId || Date.now().toString(),
      component: name,
      location: formLocation,
      torqueValue: formTorque,
      unit: formUnit,
      notes: formNotes,
    };
    setCards(prev => {
      const existing = prev.find(c => c.rifleId === selectedRifleId);
      if (existing) {
        return prev.map(c => c.rifleId !== selectedRifleId ? c : {
          ...c,
          specs: editingId
            ? c.specs.map(s => s.id === editingId ? spec : s)
            : [...c.specs, spec],
        });
      }
      return [...prev, { rifleId: selectedRifleId, specs: [spec] }];
    });
    resetForm();
  };

  const startEdit = (spec: TorqueSpec) => {
    setEditingId(spec.id);
    const isPreset = COMPONENT_PRESETS.includes(spec.component);
    setFormComponent(isPreset ? spec.component : 'Other');
    setFormCustomComponent(isPreset ? '' : spec.component);
    setFormLocation(spec.location);
    setFormTorque(spec.torqueValue);
    setFormUnit(spec.unit);
    setFormNotes(spec.notes);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this torque spec?')) return;
    setCards(prev => prev.map(c => c.rifleId !== selectedRifleId ? c : {
      ...c, specs: c.specs.filter(s => s.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Torque Specs</h2>

      <div className="flex items-end gap-4">
        <div className="space-y-2 flex-1 max-w-sm">
          <Label className="text-slate-400 text-xs uppercase tracking-widest">Select Rifle</Label>
          <Select value={selectedRifleId} onValueChange={v => { setSelectedRifleId(v); resetForm(); }}>
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
            <Plus className="w-4 h-4 mr-2" />Add Spec
          </Button>
        )}
      </div>

      {!selectedRifleId && (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
          <Gauge className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">Select a rifle to view or add torque specs</p>
        </div>
      )}

      {selectedRifleId && isAdding && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Spec' : 'New Torque Spec'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Component</Label>
              <Select value={formComponent} onValueChange={setFormComponent}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9">
                  <SelectValue placeholder="Select component…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {COMPONENT_PRESETS.map(p => (
                    <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formComponent === 'Other' && (
                <Input value={formCustomComponent} onChange={e => setFormCustomComponent(e.target.value)} placeholder="Component name" className="bg-slate-950 border-slate-700 text-white h-9 mt-1" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Location / Identifier</Label>
              <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. Front left screw" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Torque Value</Label>
              <Input type="number" step="0.1" value={formTorque} onChange={e => setFormTorque(e.target.value)} placeholder="e.g. 65" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Unit</Label>
              <Select value={formUnit} onValueChange={v => setFormUnit(v as TorqueUnit)}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="in-lbs" className="text-white">in-lbs</SelectItem>
                  <SelectItem value="ft-lbs" className="text-white">ft-lbs</SelectItem>
                  <SelectItem value="Nm" className="text-white">Nm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-400 text-xs">Notes</Label>
              <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Thread locker, sequence, etc." className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Save className="w-4 h-4 mr-2" />{editingId ? 'Update' : 'Save'}
            </Button>
            <Button onClick={resetForm} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
          </div>
        </div>
      )}

      {selectedRifleId && !isAdding && (
        <div className="space-y-1">
          {/* Column headers */}
          {specs.length > 0 && (
            <div className="grid grid-cols-12 gap-2 px-3 pb-1 border-b border-slate-800">
              <div className="col-span-4 text-xs text-slate-600 uppercase tracking-widest">Component</div>
              <div className="col-span-3 text-xs text-slate-600 uppercase tracking-widest">Location</div>
              <div className="col-span-2 text-xs text-slate-600 uppercase tracking-widest">Torque</div>
              <div className="col-span-3 text-xs text-slate-600 uppercase tracking-widest">Notes</div>
            </div>
          )}
          {specs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-500 text-sm">No torque specs yet for this rifle</p>
            </div>
          ) : (
            specs.map(spec => (
              <div key={spec.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-md hover:bg-slate-900 transition-colors">
                <div className="col-span-4">
                  <span className="text-sm text-white">{spec.component}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs text-slate-400">{spec.location || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-mono font-bold" style={{ color: '#f59e0b' }}>
                    {spec.torqueValue} <span className="text-xs font-normal text-slate-500">{spec.unit}</span>
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 truncate block">{spec.notes || '—'}</span>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button onClick={() => startEdit(spec)} className="p-1 text-slate-600 hover:text-amber-400 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(spec.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
