import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Edit, Trash2, Save, X, Crosshair, Camera } from 'lucide-react';
import { Rifle } from '../types';
import { generateId } from '../utils/id';

interface RifleFieldsProps {
  data: Partial<Rifle>;
  onChange: (field: keyof Rifle, value: string | number) => void;
}

// Moved outside to prevent re-creation on every keystroke
const RifleFields = ({ data, onChange }: RifleFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Caliber</Label>
      <Input 
        value={data.caliber || ''} 
        onChange={(e) => onChange('caliber', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="6.5 Creedmoor" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Action</Label>
      <Input 
        value={data.action || ''} 
        onChange={(e) => onChange('action', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="Remington 700" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Brand</Label>
      <Input 
        value={data.barrelBrand || ''} 
        onChange={(e) => onChange('barrelBrand', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="Bartlein" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Length (in)</Label>
      <Input 
        type="number"
        value={data.barrelLength || ''} 
        onChange={(e) => onChange('barrelLength', parseFloat(e.target.value))}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="26" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Chassis/Stock</Label>
      <Input 
        value={data.chassis || ''} 
        onChange={(e) => onChange('chassis', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="MDT ACC" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Trigger</Label>
      <Input 
        value={data.trigger || ''} 
        onChange={(e) => onChange('trigger', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="Jewell" 
      />
    </div>
  </div>
);

interface RifleManagerProps {
  rifles: Rifle[];
  setRifles: (rifles: Rifle[] | ((prev: Rifle[]) => Rifle[])) => void;
}

export function RifleManager({ rifles, setRifles }: RifleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Rifle>>({});
  const [newRifle, setNewRifle] = useState<Partial<Rifle>>({
    action: '',
    caliber: '',
    barrelBrand: '',
    barrelLength: 0,
    chassis: '',
    trigger: '',
  });

  const handleAdd = () => {
    if (!newRifle.caliber || !newRifle.action) {
      alert('Caliber and Action are required');
      return;
    }

    const rifle: Rifle = {
      id: generateId(),
      userId: 'local',
      action: newRifle.action,
      caliber: newRifle.caliber,
      barrelBrand: newRifle.barrelBrand || '',
      barrelLength: newRifle.barrelLength || 0,
      chassis: newRifle.chassis || '',
      trigger: newRifle.trigger || '',
      createdAt: new Date().toISOString(),
    };

    setRifles([...rifles, rifle]);
    setNewRifle({
      action: '',
      caliber: '',
      barrelBrand: '',
      barrelLength: 0,
      chassis: '',
      trigger: '',
    });
    setIsAdding(false);
  };

  const startEdit = (rifle: Rifle) => {
    setEditingId(rifle.id);
    setEditForm({ ...rifle });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    setRifles(rifles.map(r => r.id === editingId ? { ...r, ...editForm } as Rifle : r));
    setEditingId(null);
    setEditForm({});
  };

  const deleteRifle = (id: string) => {
    if (confirm('Are you sure you want to delete this rifle?')) {
      setRifles(rifles.filter(r => r.id !== id));
    }
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageMap(prev => ({ ...prev, [id]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Rifle Inventory</h2>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-amber-600 hover:bg-amber-500 text-white"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Rifle'}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-800 border-slate-700 border-2 border-dashed border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Add New Rifle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RifleFields data={newRifle} onChange={(field, value) => setNewRifle({ ...newRifle, [field]: value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="w-4 h-4 mr-2" />Save Rifle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rifles.map((rifle) => (
          <Card key={rifle.id} className="bg-slate-900 border-slate-800 card-tactical overflow-hidden">
            {editingId === rifle.id ? (
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Editing Profile</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-slate-400 hover:text-white p-1 h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={saveEdit} className="bg-amber-600 hover:bg-amber-700 p-1 h-8 w-8">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <RifleFields data={editForm} onChange={(field, value) => setEditForm({ ...editForm, [field]: value })} />
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="bg-amber-500 text-slate-900 font-bold text-lg px-3 py-1 rounded shadow-sm">
                      {rifle.caliber}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(rifle)} className="text-slate-400 hover:text-white p-1 h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteRifle(rifle.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-white text-base mt-2">{rifle.action}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    {rifle.barrelBrand} • {rifle.barrelLength}" Barrel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div className="text-slate-500">Chassis:</div>
                    <div className="text-slate-200 text-right truncate">{rifle.chassis || '-'}</div>
                    
                    <div className="text-slate-500">Trigger:</div>
                    <div className="text-slate-200 text-right truncate">{rifle.trigger || '-'}</div>
                  </div>

                  {/* Rifle Image */}
                  {imageMap[rifle.id] ? (
                    <div className="mt-3 relative group">
                      <img
                        src={imageMap[rifle.id]}
                        alt={rifle.caliber}
                        className="w-full h-36 object-cover rounded-lg border border-slate-700"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                        <Camera className="w-6 h-6 text-white mr-2" />
                        <span className="text-white text-xs">Change photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(rifle.id, e)} />
                      </label>
                    </div>
                  ) : (
                    <label className="mt-3 flex items-center justify-center gap-2 w-full py-2 border border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-amber-600 transition-colors text-slate-500 hover:text-amber-500 text-xs">
                      <Camera className="w-4 h-4" />
                      Add photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(rifle.id, e)} />
                    </label>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
      
      {rifles.length === 0 && !isAdding && (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
          <Crosshair className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No rifles in inventory</p>
          <p className="text-sm">Add your first rifle to start tracking data.</p>
        </div>
      )}
    </div>
  );
}