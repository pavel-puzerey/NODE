import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Edit, Save, X, Package2 } from 'lucide-react';
import { Load } from '../types';

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
}

const BULLET_TYPES = ['FMJ', 'HP', 'JHP', 'SP', 'BTHP', 'ELD-M', 'ELD-X', 'Hybrid', 'VLD', 'HPBT', 'Ballistic Tip', 'Other'];

export function AmmoInventory({ loads, ammo, setAmmo }: AmmoInventoryProps) {
  const [activeTab, setActiveTab] = useState<AmmoType>('factory');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const factoryItems = ammo.filter(a => a.type === 'factory') as FactoryAmmo[];
  const handloadItems = ammo.filter(a => a.type === 'handload') as HandloadAmmo[];
  const activeItems = activeTab === 'factory' ? factoryItems : handloadItems;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Ammo Inventory</h2>

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
        <div
          onClick={() => setIsAdding(true)}
          className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
        >
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Add your first {activeTab === 'factory' ? 'factory ammo' : 'handload batch'}</p>
          <p className="text-sm">Click to start tracking inventory.</p>
        </div>
      )}

      <div className="space-y-2">
        {activeTab === 'factory' && factoryItems.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
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
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {/* Quantity adjuster */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-white w-4 text-center">−</button>
                <span className="text-sm font-mono text-white w-10 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-white w-4 text-center">+</button>
              </div>
              <button onClick={() => populateForm(item)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}

        {activeTab === 'handload' && handloadItems.map(item => {
          const [y, m, d] = item.dateLoaded.split('-');
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const dateLabel = `${months[parseInt(m)-1]} ${d}, ${y}`;
          return (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{getLoadLabel(item.loadId)}</div>
                  <div className="flex flex-wrap gap-x-3 text-xs mt-0.5">
                    <span><span className="text-slate-600">Loaded: </span><span className="text-slate-400">{dateLabel}</span></span>
                    {item.lot && <span><span className="text-slate-600">Batch: </span><span className="text-slate-400">{item.lot}</span></span>}
                    {item.notes && <span className="text-slate-500 italic">{item.notes}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-white w-4 text-center">−</button>
                  <span className="text-sm font-mono text-white w-10 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-white w-4 text-center">+</button>
                </div>
                <button onClick={() => populateForm(item)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
