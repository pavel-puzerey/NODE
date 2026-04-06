import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Plus, Edit, Trash2, Save, X, Beaker, Package, Zap } from 'lucide-react';
import { Load } from '../types';
import { generateId } from '../utils/id';

interface LoadFormProps {
  data: Partial<Load>;
  onChange: (field: keyof Load, value: string | number) => void;
}

// Moved outside to prevent re-creation on every keystroke
const LoadForm = ({ data, onChange }: LoadFormProps) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1 md:col-span-2">
        <Label className="text-slate-400 text-xs">Bullet (Brand, Model, Weight)</Label>
        <div className="relative">
          <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            value={data.bulletId || ''} 
            onChange={(e) => onChange('bulletId', e.target.value)}
            className="bg-slate-950 border-slate-700 text-white pl-9" 
            placeholder="e.g. Hornady ELD-M 140gr" 
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Powder</Label>
        <div className="relative">
          <Zap className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            value={data.powderId || ''} 
            onChange={(e) => onChange('powderId', e.target.value)}
            className="bg-slate-950 border-slate-700 text-white pl-9" 
            placeholder="e.g. H4350" 
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Charge Weight (gr)</Label>
        <Input 
          type="number"
          step="0.1"
          value={data.charge || ''} 
          onChange={(e) => onChange('charge', parseFloat(e.target.value))}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="42.5" 
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Case</Label>
        <Input 
          value={data.caseId || ''} 
          onChange={(e) => onChange('caseId', e.target.value)}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="e.g. Lapua" 
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Primer</Label>
        <Input 
          value={data.primerId || ''} 
          onChange={(e) => onChange('primerId', e.target.value)}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="e.g. CCI BR4" 
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">OAL (in)</Label>
        <Input 
          type="number"
          step="0.001"
          value={data.oal || ''} 
          onChange={(e) => onChange('oal', parseFloat(e.target.value))}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="2.800" 
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Seating Depth (in)</Label>
        <Input 
          type="number"
          step="0.001"
          value={data.seatingDepthIn || ''} 
          onChange={(e) => onChange('seatingDepthIn', parseFloat(e.target.value))}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="0.002" 
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-400 text-xs">Neck Tension (in)</Label>
        <Input 
          type="number"
          step="0.001"
          value={data.neckTensionIn || ''} 
          onChange={(e) => onChange('neckTensionIn', parseFloat(e.target.value))}
          className="bg-slate-950 border-slate-700 text-white" 
          placeholder="0.002" 
        />
      </div>
    </div>

    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Notes</Label>
      <Textarea 
        value={data.notes || ''} 
        onChange={(e) => onChange('notes', e.target.value)}
        className="bg-slate-950 border-slate-700 text-white min-h-[60px]" 
        placeholder="Load characteristics, pressure signs, etc." 
      />
    </div>
  </div>
);

interface LoadDevelopmentProps {
  loads: Load[];
  setLoads: (loads: Load[] | ((prev: Load[]) => Load[])) => void;
}

export function LoadDevelopment({ loads, setLoads }: LoadDevelopmentProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Load>>({});
  const [newLoad, setNewLoad] = useState<Partial<Load>>({
    bulletId: '',
    caseId: '',
    powderId: '',
    primerId: '',
    charge: 0,
    oal: 0,
    seatingDepthIn: 0,
    neckTensionIn: 0,
    notes: '',
  });

  const handleAdd = () => {
    if (!newLoad.bulletId || !newLoad.charge) {
      alert('Bullet and Charge Weight are required');
      return;
    }

    const load: Load = {
      id: generateId(),
      userId: 'local',
      bulletId: newLoad.bulletId,
      caseId: newLoad.caseId || '',
      powderId: newLoad.powderId || '',
      primerId: newLoad.primerId || '',
      charge: newLoad.charge,
      oal: newLoad.oal || 0,
      seatingDepthIn: newLoad.seatingDepthIn || 0,
      neckTensionIn: newLoad.neckTensionIn || 0,
      notes: newLoad.notes,
      createdAt: new Date().toISOString(),
    };

    setLoads([...loads, load]);
    setNewLoad({
      bulletId: '',
      caseId: '',
      powderId: '',
      primerId: '',
      charge: 0,
      oal: 0,
      seatingDepthIn: 0,
      neckTensionIn: 0,
      notes: '',
    });
    setIsAdding(false);
  };

  const startEdit = (load: Load) => {
    setEditingId(load.id);
    setEditForm({ ...load });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    setLoads(loads.map(l => l.id === editingId ? { ...l, ...editForm } as Load : l));
    setEditingId(null);
    setEditForm({});
  };

  const deleteLoad = (id: string) => {
    if (confirm('Are you sure you want to delete this load?')) {
      setLoads(loads.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Load Recipes</h2>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-amber-600 hover:bg-amber-500 text-white"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'New Load'}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-800 border-slate-700 border-2 border-dashed border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Create New Load Recipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadForm data={newLoad} onChange={(field, value) => setNewLoad({ ...newLoad, [field]: value })} />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="w-4 h-4 mr-2" />Save Recipe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loads.map((load) => (
          <Card key={load.id} className="bg-slate-900 border-slate-800 card-tactical flex flex-col">
            {editingId === load.id ? (
              <CardContent className="p-4 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Editing Recipe</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-slate-400 hover:text-white p-1 h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={saveEdit} className="bg-amber-600 hover:bg-amber-700 p-1 h-8 w-8">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <LoadForm data={editForm} onChange={(field, value) => setEditForm({ ...editForm, [field]: value })} />
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-3 bg-gradient-to-r from-amber-900/20 to-transparent border-b border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-amber-400 font-bold text-lg leading-tight">
                        {load.bulletId}
                      </div>
                      <div className="text-white text-2xl font-bold mt-1">
                        {load.charge} <span className="text-sm font-normal text-slate-400">gr</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(load)} className="text-slate-400 hover:text-white p-1 h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLoad(load.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs mb-0.5">Powder</div>
                      <div className="text-slate-200 font-medium truncate">{load.powderId || '-'}</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs mb-0.5">Primer</div>
                      <div className="text-slate-200 font-medium truncate">{load.primerId || '-'}</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs mb-0.5">Case</div>
                      <div className="text-slate-200 font-medium truncate">{load.caseId || '-'}</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs mb-0.5">OAL</div>
                      <div className="text-slate-200 font-medium">{load.oal ? `${load.oal}"` : '-'}</div>
                    </div>
                  </div>
                  
                  {load.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="text-slate-500 text-xs mb-1">Notes</div>
                      <p className="text-slate-300 text-xs italic line-clamp-2">{load.notes}</p>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {loads.length === 0 && !isAdding && (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
          <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No load recipes found</p>
          <p className="text-sm">Document your load development here.</p>
        </div>
      )}
    </div>
  );
}