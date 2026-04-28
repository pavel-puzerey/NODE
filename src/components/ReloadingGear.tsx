import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Save, X, Edit, Package } from 'lucide-react';
import { GearItem } from '../types';
import { generateId } from '../utils/id';

interface ReloadingGearProps {
  gear: GearItem[];
  setGear: (gear: GearItem[] | ((prev: GearItem[]) => GearItem[])) => void;
}

export function ReloadingGear({ gear, setGear }: ReloadingGearProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GearItem>>({
    gearType: 'Bullet',
    brand: '',
    model: '',
    weight: undefined,
    diameter: undefined,
    lot: '',
    primerSize: '',
    notes: '',
  });

  const handleSubmit = () => {
    if (!formData.brand || !formData.model) return;

    const newItem: GearItem = {
      id: editingId || generateId(),
      userId: 'user-1',
      gearType: formData.gearType || 'Bullet',
      brand: formData.brand,
      model: formData.model,
      weight: formData.weight,
      diameter: formData.diameter,
      lot: formData.lot,
      primerSize: formData.primerSize,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      setGear(gear.map(item => item.id === editingId ? newItem : item));
      setEditingId(null);
    } else {
      setGear([...gear, newItem]);
    }

    resetForm();
  };

  const handleEdit = (item: GearItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setGear(gear.filter(item => item.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      gearType: 'Bullet',
      brand: '',
      model: '',
      weight: undefined,
      diameter: undefined,
      lot: '',
      primerSize: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const gearTypes: GearItem['gearType'][] = [
    'Bullet',
    'Case',
    'Powder',
    'Primer',
    'Reloading Press',
    'Sizing Die',
    'Seating Die',
    'Scale',
    'Trickler',
    'Annealer',
    'Primer Tool',
    'Case Cleaning System',
    'Case Trimmer',
    'Headspace Comparator',
    'Bullet Comparator',
    'Bullet Puller',
    'Expander Mandrel Die' as any,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reloading Gear</h2>
        </div>
        {!isAdding && gear.length > 0 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Gear
          </button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader>
            <CardTitle className="text-white">{editingId ? 'Edit Gear' : 'Add New Gear'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Gear Type</Label>
                <Select 
                  value={formData.gearType} 
                  onValueChange={(value: GearItem['gearType']) => setFormData({ ...formData, gearType: value })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700" position="popper" sideOffset={4} style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {gearTypes.map(type => (
                      <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Brand</Label>
                <Input 
                  value={formData.brand} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, brand: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder={({'Bullet':'e.g., Hornady','Case':'e.g., Lapua','Powder':'e.g., Hodgdon','Primer':'e.g., CCI','Reloading Press':'e.g., Redding','Sizing Die':'e.g., Redding','Seating Die':'e.g., Redding','Scale':'e.g., RCBS','Trickler':'e.g., AutoTrickler','Annealer':'e.g., Annealeez','Primer Tool':'e.g., CPS','Case Cleaning System':'e.g., Frankford Arsenal','Case Trimmer':'e.g., Giraud','Headspace Comparator':'e.g., Hornady','Bullet Comparator':'e.g., Hornady','Bullet Puller':'e.g., RCBS','Expander Mandrel Die':'e.g., 21st Century'} as Record<string,string>)[formData.gearType||'']||'Brand'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Model</Label>
                <Input 
                  value={formData.model} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, model: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder={({'Bullet':'e.g., ELD-M 140gr','Case':'e.g., 6.5 Creedmoor','Powder':'e.g., H4350','Primer':'e.g., BR4','Reloading Press':'e.g., T-7 Turret','Sizing Die':'e.g., Body Die 6.5 CM','Seating Die':'e.g., Competition Seating Die','Scale':'e.g., ChargeMaster Lite','Trickler':'e.g., V4','Annealer':'e.g., Model 2','Primer Tool':'e.g., Hand Primer','Case Cleaning System':'e.g., Platinum Tumbler','Case Trimmer':'e.g., Power Trimmer','Headspace Comparator':'e.g., LNL Comparator','Bullet Comparator':'e.g., LNL Insert Set','Bullet Puller':'e.g., Collet Puller','Expander Mandrel Die':'e.g., 6.5mm Mandrel'} as Record<string,string>)[formData.gearType||'']||'Model'}
                />
              </div>
              {formData.gearType === 'Bullet' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Weight (gr)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={formData.weight || ''} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              )}
              {formData.gearType === 'Powder' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Weight (lbs)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={formData.weight || ''} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              )}
              {formData.gearType === 'Bullet' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Diameter (in)</Label>
                  <Input 
                    type="number" 
                    step="0.001"
                    value={formData.diameter || ''} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, diameter: parseFloat(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              )}
              {formData.gearType === 'Primer' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Size</Label>
                  <Select 
                    value={formData.primerSize} 
                    onValueChange={(value: string) => setFormData({ ...formData, primerSize: value })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700" position="popper" sideOffset={4} style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <SelectItem value="Small Rifle" className="text-white">Small Rifle</SelectItem>
                      <SelectItem value="Small Rifle Magnum" className="text-white">Small Rifle Magnum</SelectItem>
                      <SelectItem value="Large Rifle" className="text-white">Large Rifle</SelectItem>
                      <SelectItem value="Large Rifle Magnum" className="text-white">Large Rifle Magnum</SelectItem>
                      <SelectItem value="Small Pistol" className="text-white">Small Pistol</SelectItem>
                      <SelectItem value="Large Pistol" className="text-white">Large Pistol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Lot Number</Label>
                <Input 
                  value={formData.lot || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lot: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., LOT-12345"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Notes</Label>
                <Input 
                  value={formData.notes || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="mr-2 h-4 w-4" />
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {gear.map((item) => (
          <div key={item.id} className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[130px] text-center flex-shrink-0">{item.gearType}</span>
              <div className="min-w-0">
                <div className="font-medium text-white text-sm">{item.brand} {item.model}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {item.weight && <span className="text-xs"><span className="text-slate-600">Weight: </span><span className="text-slate-400">{item.weight} {item.gearType === 'Powder' ? 'lbs' : 'gr'}</span></span>}
                  {item.diameter && <span className="text-xs"><span className="text-slate-600">Diameter: </span><span className="text-slate-400">{item.diameter}"</span></span>}
                  {item.primerSize && <span className="text-xs"><span className="text-slate-600">Size: </span><span className="text-slate-400">{item.primerSize}</span></span>}
                  {item.lot && <span className="text-xs"><span className="text-slate-600">Lot #: </span><span className="text-slate-400">{item.lot}</span></span>}
                  {item.notes && <span className="text-xs"><span className="text-slate-600">Notes: </span><span className="text-slate-400">{item.notes}</span></span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-400 hover:bg-slate-700 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {gear.length === 0 && !isAdding && (
        <div
          onClick={() => setIsAdding(true)}
          className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
        >
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Add your first item</p>
          <p className="text-sm">Click to start tracking reloading gear.</p>
        </div>
      )}
    </div>
  );
}