import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Save, X, Edit, Shield } from 'lucide-react';
import { Accessory } from '../types';
import { generateId } from '../utils/id';

interface AccessoriesProps {
  accessories: Accessory[];
  setAccessories: (accessories: Accessory[] | ((prev: Accessory[]) => Accessory[])) => void;
}

export function Accessories({ accessories, setAccessories }: AccessoriesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Accessory>>({
    accessoryType: 'Bipod',
    brand: '',
    model: '',
    weight: undefined,
    notes: '',
  });

  const handleSubmit = () => {
    if (!formData.brand || !formData.model) return;

    const newItem: Accessory = {
      id: editingId || generateId(),
      userId: 'user-1',
      accessoryType: formData.accessoryType || 'Bipod',
      brand: formData.brand,
      model: formData.model,
      weight: formData.weight,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      setAccessories(accessories.map(item => item.id === editingId ? newItem : item));
      setEditingId(null);
    } else {
      setAccessories([...accessories, newItem]);
    }

    resetForm();
  };

  const handleEdit = (item: Accessory) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this accessory?')) {
      setAccessories(accessories.filter(item => item.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      accessoryType: 'Bipod',
      brand: '',
      model: '',
      weight: undefined,
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const accessoryTypes: Accessory['accessoryType'][] = [
    'Bipod',
    'Suppressor',
    'Muzzle Brake',
    'Shooting Bag',
    'Sling',
    'Chronograph',
    'Tripod',
    'Rifle Case',
    'Magazines',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Accessories</h2>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdding ? 'Cancel' : 'Add Accessory'}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader>
            <CardTitle className="text-white">{editingId ? 'Edit Accessory' : 'Add New Accessory'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Accessory Type</Label>
                <Select 
                  value={formData.accessoryType} 
                  onValueChange={(value: Accessory['accessoryType']) => setFormData({ ...formData, accessoryType: value })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {accessoryTypes.map(type => (
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
                  placeholder="e.g., Atlas"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Model</Label>
                <Input 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., CAL (Standard)"
                />
              </div>
              {formData.accessoryType === 'Shooting Bag' && (
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

      <div className="space-y-2">
        {accessories.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {}}
              className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[100px] text-center">
                  {item.accessoryType}
                </span>
                <div>
                  <div className="font-medium text-white text-sm">{item.brand} {item.model}</div>
                  {item.weight && item.accessoryType === 'Shooting Bag' && (
                    <div className="text-xs text-slate-400">{item.weight} lbs</div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-slate-500 mt-0.5">{item.notes}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </button>
          </div>
        ))}
      </div>

      {accessories.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Click "Add Accessory" to get started</p>
        </div>
      )}
    </div>
  );
}