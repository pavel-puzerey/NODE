import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Edit, Save, X, Package2, ChevronDown, ChevronUp } from 'lucide-react';
import { Load, RangeSession } from '../types';

export type AmmoType = 'factory' | 'handload';

export interface FactoryAmmo {
  id: string;
  type: 'factory';
  brand: string;
  name: string;
  caliber: string;
  bulletWeight: string;
  bulletType: string;
  lot: string;
  quantity: number;
  pricePerRound: string;
  notes: string;
  createdAt: string;
}

export interface HandloadAmmo {
  id: string;
  type: 'handload';
  loadId: string;
  quantity: number;
  dateLoaded: string;
  lot: string;
  notes: string;
  createdAt: string;
}

export type AmmoItem = FactoryAmmo | HandloadAmmo;

interface AmmoInventoryProps {
  loads: Load[];
  ammo: AmmoItem[];
  setAmmo: (ammo: AmmoItem[] | ((prev: AmmoItem[]) => AmmoItem[])) => void;
  sessions?: RangeSession[];
}

const BULLET_TYPES = ['FMJ', 'HP', 'JHP', 'SP', 'BTHP', 'ELD-M', 'ELD-X', 'Hybrid', 'VLD', 'HPBT', 'Ballistic Tip', 'Other'];

export function AmmoInventory({ loads, ammo, setAmmo, sessions = [] }: AmmoInventoryProps) {
  const [activeTab, setActiveTab] = useState<AmmoType>('factory');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Factory form state
  const [fBrand, setFBrand] = useState('');
  const [fName, setFName] = useState('');
  const [fCaliber, setFCaliber] = useState('');
  const [fBulletWeight, setFBulletWeight] = useState('');
  const [fBulletType, setFBulletType] = useState('');
  const [fLot, setFLot] = useState('');
  const [fQuantity, setFQuantity] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fNotes, setFNotes] = useState('');

  // Handload form state
  const [hLoadId, setHLoadId] = useState('');
  const [hQuantity, setHQuantity] = useState('');
  const [hDate, setHDate] = useState(new Date().toISOString().split('T')[0]);
  const [hLot, setHLot] = useState('');
  const [hNotes, setHNotes] = useState('');

  const resetForm = () => {
    setFBrand(''); setFName(''); setFCaliber(''); setFBulletWeight('');
    setFBulletType(''); setFLot(''); setFQuantity(''); setFPrice(''); setFNotes('');
    setHLoadId(''); setHQuantity(''); setHDate(new Date().toISOString().split('T')[0]);
    setHLot(''); setHNotes('');
    setIsAdding(false); setEditingId(null);
  };

  const populateForm = (item: AmmoItem) => {
    setEditingId(item.id);
    setActiveTab(item.type);
    if (item.type === 'factory') {
      setFBrand(item.brand); setFName(item.name); setFCaliber(item.caliber);
      setFBulletWeight(item.bulletWeight); setFBulletType(item.bulletType);
      setFLot(item.lot); setFQuantity(String(item.quantity));
      setFPrice(item.pricePerRound); setFNotes(item.notes);
    } else {
      setHLoadId(item.loadId); setHQuantity(String(item.quantity));
      setHDate(item.dateLoaded); setHLot(item.lot); setHNotes(item.notes);
    }
    setIsAdding(true);
  };

  const handleSave = () => {
    const id = editingId || Date.now().toString();
    let newItem: AmmoItem;

    if (activeTab === 'factory') {
      if (!fBrand || !fCaliber || !fQuantity) return;
      newItem = {
        id, type: 'factory', brand: fBrand, name: fName, caliber: fCaliber,
        bulletWeight: fBulletWeight, bulletType: fBulletType, lot: fLot,
        quantity: parseInt(fQuantity) || 0, pricePerRound: fPrice, notes: fNotes,
        createdAt: new Date().toISOString(),
      };
    } else {
      if (!hLoadId || !hQuantity) return;
      newItem = {
        id, type: 'handload', loadId: hLoadId, quantity: parseInt(hQuantity) || 0,
        dateLoaded: hDate, lot: hLot, notes: hNotes,
        createdAt: new Date().toISOString(),
      };
    }

    if (editingId) {
      setAmmo(ammo.map(a => a.id === editingId ? newItem : a));
    } else {
      setAmmo([...ammo, newItem]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this ammo entry?')) return;
    setAmmo(ammo.filter(a => a.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setAmmo(ammo.map(a => a.id === id ? { ...a, quantity: Math.max(0, a.quantity + delta) } : a));
  };

  const getLoadLabel = (loadId: string) => {
    const load = loads.find(l => l.id === loadId);
    if (!load) return 'Unknown Load';
    return `${load.charge}gr — ${load.bulletId || ''} ${load.powderId || ''}`.trim();
  };

  const getUsageHistory = (ammoId: string) => {
    return sessions
      .filter(s => (s as any).ammoUsageId === ammoId && (s as any).shotsFired > 0)
      .map(s => ({
        date: s.sessionDate.slice(0, 10),
        shots: (s as any).shotsFired as number,
        rifleId: s.rifleId,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const factoryItems = ammo.filter(a => a.type === 'factory') as FactoryAmmo[];
  const handloadItems = ammo.filter(a => a.type === 'handload') as HandloadAmmo[];
  const activeItems = activeTab === 'factory' ? factoryItems : handloadItems;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Ammo Inventory</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Add Ammo
          </Button>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-slate-900 rounded-md p-1 border border-slate-800 w-fit">
        {(['factory', 'handload'] as AmmoType[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === t ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
            style={activeTab === t ? { backgroundColor: '#f59e0b' } : {}}
          >
            {t === 'factory' ? 'Factory' : 'Handloads'}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {isAdding && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit' : 'New'} {activeTab === 'factory' ? 'Factory Ammo' : 'Handload Batch'}</h3>
            {!editingId && (
              <div className="flex gap-1 bg-slate-800 rounded p-0.5">
                {(['factory', 'handload'] as AmmoType[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${activeTab === t ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {t === 'factory' ? 'Factory' : 'Handload'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'factory' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Brand *</Label>
                <Input value={fBrand} onChange={e => setFBrand(e.target.value)} placeholder="e.g. Federal" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Product Name</Label>
                <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Gold Medal Match" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Caliber *</Label>
                <Input value={fCaliber} onChange={e => setFCaliber(e.target.value)} placeholder="e.g. 6.5 Creedmoor" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Bullet Weight (gr)</Label>
                <Input value={fBulletWeight} onChange={e => setFBulletWeight(e.target.value)} placeholder="e.g. 140" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Bullet Type</Label>
                <Select value={fBulletType} onValueChange={setFBulletType}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {BULLET_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Lot Number</Label>
                <Input value={fLot} onChange={e => setFLot(e.target.value)} placeholder="e.g. L12345" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Quantity (rounds) *</Label>
                <Input type="number" value={fQuantity} onChange={e => setFQuantity(e.target.value)} placeholder="e.g. 200" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Price per Round ($)</Label>
                <Input type="number" step="0.01" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="e.g. 1.25" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-slate-400 text-xs">Notes</Label>
                <Input value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Storage location, condition, etc." className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-slate-400 text-xs">Load Recipe *</Label>
                <Select value={hLoadId} onValueChange={setHLoadId}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9"><SelectValue placeholder="Select load recipe…" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {loads.length === 0
                      ? <SelectItem value="_none" disabled className="text-slate-500">No load recipes found</SelectItem>
                      : loads.map(l => <SelectItem key={l.id} value={l.id} className="text-white">{l.charge}gr — {l.bulletId || ''} {l.powderId || ''}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Quantity (rounds) *</Label>
                <Input type="number" value={hQuantity} onChange={e => setHQuantity(e.target.value)} placeholder="e.g. 100" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Date Loaded</Label>
                <Input type="date" value={hDate} onChange={e => setHDate(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Lot / Batch Number</Label>
                <Input value={hLot} onChange={e => setHLot(e.target.value)} placeholder="e.g. B001" className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Notes</Label>
                <Input value={hNotes} onChange={e => setHNotes(e.target.value)} placeholder="Storage, annealed brass, etc." className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Save className="w-4 h-4 mr-2" />{editingId ? 'Update' : 'Save'}
            </Button>
            <Button onClick={resetForm} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
          </div>
        </div>
      )}

      {/* Items list */}
      {activeItems.length === 0 && !isAdding && (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
          <Package2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">No {activeTab === 'factory' ? 'factory ammo' : 'handload batches'} in inventory</p>
        </div>
      )}

      <div className="space-y-2">
        {activeTab === 'factory' && factoryItems.map(item => {
          const history = getUsageHistory(item.id);
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-slate-800 transition-colors">
                <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded border flex-shrink-0" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
                    {item.caliber}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{item.brand}{item.name ? ` — ${item.name}` : ''}</div>
                    <div className="flex flex-wrap gap-x-3 text-xs mt-0.5">
                      {item.bulletWeight && <span><span className="text-slate-600">Wt: </span><span className="text-slate-400">{item.bulletWeight}gr</span></span>}
                      {item.bulletType && <span><span className="text-slate-600">Type: </span><span className="text-slate-400">{item.bulletType}</span></span>}
                      {item.lot && <span><span className="text-slate-600">Lot: </span><span className="text-slate-400">{item.lot}</span></span>}
                      {item.pricePerRound && <span><span className="text-slate-600">Price: </span><span className="text-slate-400">${item.pricePerRound}/rd</span></span>}
                      {item.notes && <span className="text-slate-500 italic">{item.notes}</span>}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-white w-4 text-center">−</button>
                    <span className="text-sm font-mono text-white w-10 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-white w-4 text-center">+</button>
                  </div>
                  <button onClick={() => populateForm(item)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="p-1.5 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-800 px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Usage History</p>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-600">No usage recorded yet</p>
                  ) : (
                    <div className="space-y-1">
                      {history.map((h, i) => {
                        const [y, m, d] = h.date.split('-');
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{months[parseInt(m)-1]} {d}, {y}</span>
                            <span className="text-amber-400 font-mono">{h.shots} rds</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between text-xs">
                        <span className="text-slate-500">Total fired</span>
                        <span className="text-slate-300 font-mono">{history.reduce((s, h) => s + h.shots, 0)} rds</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeTab === 'handload' && handloadItems.map(item => {
          const [y, m, d] = item.dateLoaded.split('-');
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const dateLabel = `${months[parseInt(m)-1]} ${d}, ${y}`;
          const history = getUsageHistory(item.id);
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-slate-800 transition-colors">
                <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{getLoadLabel(item.loadId)}</div>
                    <div className="flex flex-wrap gap-x-3 text-xs mt-0.5">
                      <span><span className="text-slate-600">Loaded: </span><span className="text-slate-400">{dateLabel}</span></span>
                      {item.lot && <span><span className="text-slate-600">Batch: </span><span className="text-slate-400">{item.lot}</span></span>}
                      {item.notes && <span className="text-slate-500 italic">{item.notes}</span>}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-white w-4 text-center">−</button>
                    <span className="text-sm font-mono text-white w-10 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-white w-4 text-center">+</button>
                  </div>
                  <button onClick={() => populateForm(item)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="p-1.5 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-800 px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Usage History</p>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-600">No usage recorded yet</p>
                  ) : (
                    <div className="space-y-1">
                      {history.map((h, i) => {
                        const [hy, hm, hd] = h.date.split('-');
                        const hmonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{hmonths[parseInt(hm)-1]} {hd}, {hy}</span>
                            <span className="text-amber-400 font-mono">{h.shots} rds</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between text-xs">
                        <span className="text-slate-500">Total fired</span>
                        <span className="text-slate-300 font-mono">{history.reduce((s, h) => s + h.shots, 0)} rds</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
