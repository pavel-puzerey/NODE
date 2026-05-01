import React, { useState } from 'react';
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
    'Weather Meter' as any,
    'Scope Rings/Mount' as any,
    'Level',
    'Stage Timer' as any,
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Accessories</h2>
        </div>
        {!isAdding && accessories.length > 0 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Accessory
          </button>
        )}
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
                  <SelectContent className="bg-slate-900 border-slate-700" position="popper" sideOffset={4} style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, brand: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder={({'Bipod':'e.g., Atlas','Suppressor':'e.g., SilencerCo','Muzzle Brake':'e.g., APA','Shooting Bag':'e.g., Armageddon Gear','Sling':'e.g., Magpul','Chronograph':'e.g., Garmin','Tripod':'e.g., Really Right Stuff','Rifle Case':'e.g., Pelican','Magazines':'e.g., AICS','Weather Meter':'e.g., Kestrel','Scope Rings/Mount':'e.g., Spuhr','Level':'e.g., Spuhr','Stage Timer':'e.g., Shooters Global','Other':'Brand'} as Record<string,string>)[formData.accessoryType||'Other']||'Brand'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Model</Label>
                <Input 
                  value={formData.model} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, model: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder={({'Bipod':'e.g., CAL (Standard)','Suppressor':'e.g., Omega 300','Muzzle Brake':'e.g., Fast Bastard Gen 3','Shooting Bag':'e.g., Game Changer','Sling':'e.g., MS1','Chronograph':'e.g., Xero C1 Pro','Tripod':'e.g., TVC-34L','Rifle Case':'e.g., 1720','Magazines':'e.g., 10-round .308','Weather Meter':'e.g., 5700 Elite','Scope Rings/Mount':'e.g., SP-4001','Level':'e.g., Scope Level 30mm','Stage Timer':'e.g., Pulse Pro','Other':'Model'} as Record<string,string>)[formData.accessoryType||'Other']||'Model'}
                />
              </div>
              {formData.accessoryType === 'Shooting Bag' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Weight (lbs)</Label>
                  <Input type="number" step="0.1" value={formData.weight || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, weight: parseFloat(e.target.value) })} className="bg-slate-900 border-slate-700 text-white" />
                </div>
              )}
              {formData.accessoryType === 'Shooting Bag' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Fill Type</Label>
                  <Input value={(formData as any).fillType || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fillType: e.target.value } as any)} className="bg-slate-900 border-slate-700 text-white" placeholder="e.g., Barricade Blend, Sand, Rubber Shot" />
                </div>
              )}
              {formData.accessoryType === 'Tripod' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Ballhead</Label>
                  <Input value={(formData as any).ballhead || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ballhead: e.target.value } as any)} className="bg-slate-900 border-slate-700 text-white" placeholder="e.g., RRS BH-40, Arca-Swiss Z1" />
                </div>
              )}
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
        {accessories.map((item) => (
          <div key={item.id} className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[110px] text-center flex-shrink-0">{item.accessoryType}</span>
              <div className="min-w-0">
                <div className="font-medium text-white text-sm">{item.brand} {item.model}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {item.weight && item.accessoryType === 'Shooting Bag' && <span className="text-xs"><span className="text-slate-600">Weight: </span><span className="text-slate-400">{item.weight} lbs</span></span>}
                  {(item as any).fillType && item.accessoryType === 'Shooting Bag' && <span className="text-xs"><span className="text-slate-600">Fill: </span><span className="text-slate-400">{(item as any).fillType}</span></span>}
                  {(item as any).ballhead && item.accessoryType === 'Tripod' && <span className="text-xs"><span className="text-slate-600">Ballhead: </span><span className="text-slate-400">{(item as any).ballhead}</span></span>}
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

      {accessories.length === 0 && !isAdding && (
        <div onClick={() => setIsAdding(true)} className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Add your first accessory</p>
          <p className="text-sm">Click to start tracking accessories.</p>
        </div>
      )}
    </div>
  );
}