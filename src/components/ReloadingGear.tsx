import { useState } from 'react';
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
    'Expander Mandrel Die',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reloading Gear</h2>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdding ? 'Cancel' : 'Add Gear'}
        </Button>
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
                  <SelectContent className="bg-slate-900 border-slate-700">
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
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., Hornady"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Model</Label>
                <Input 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., ELD-M"
                />
              </div>
              {formData.gearType === 'Bullet' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Weight (gr)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={formData.weight || ''} 
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, diameter: parseFloat(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              )}
              {formData.gearType === 'Primer' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Size</Label>
                  <Select 
                    value={formData.primerSize} 
                    onValueChange={(value) => setFormData({ ...formData, primerSize: value })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
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
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., LOT-12345"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Notes</Label>
                <Input 
                  value={formData.notes || ''} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gear.map((item) => (
          <Card key={item.id} className="bg-slate-900 border-slate-800 card-tactical">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded">
                  {item.gearType}
                </span>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(item)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <CardTitle className="text-white text-lg">{item.brand}</CardTitle>
                <CardDescription className="text-slate-400">{item.model}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {item.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Weight</span>
                    <span className="text-white font-medium">{item.weight} {item.gearType === 'Powder' ? 'lbs' : 'gr'}</span>
                  </div>
                )}
                {item.diameter && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Diameter</span>
                    <span className="text-white font-medium">{item.diameter}"</span>
                  </div>
                )}
                {item.lot && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Lot #</span>
                    <span className="text-white font-medium">{item.lot}</span>
                  </div>
                )}
                {item.primerSize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Size</span>
                    <span className="text-white font-medium">{item.primerSize}</span>
                  </div>
                )}
                {item.notes && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-500">{item.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gear.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Click "Add Gear" to get started</p>
        </div>
      )}
    </div>
  );
}