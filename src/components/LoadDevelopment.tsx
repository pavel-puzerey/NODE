import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Plus, Edit, Trash2, Save, X, Beaker, Package, Zap, Copy, Star, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedBullets, setExpandedBullets] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyLoad = (load: Load) => {
    const copied: Load = {
      ...load,
      id: generateId(),
      charge: load.charge,
      notes: load.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    setLoads([...loads, copied]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Load Recipes</h2>
        {!isAdding && loads.length > 0 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" />New Load
          </button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-slate-800 border-slate-700 border-2 border-dashed border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Create New Load Recipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadForm data={newLoad} onChange={(field, value) => setNewLoad({ ...newLoad, [field]: value })} />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="w-4 h-4 mr-2" />Save Recipe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorites section */}
      {favorites.size > 0 && (
        <div className="border border-amber-900/40 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowFavorites(f => !f)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-900/10 hover:bg-amber-900/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" style={{ fill: 'currentColor' }} />
              <span className="text-sm font-semibold text-amber-400">Favorites</span>
              <span className="text-xs text-amber-600">{favorites.size} {favorites.size === 1 ? 'recipe' : 'recipes'}</span>
            </div>
            {showFavorites ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
          </button>
          {showFavorites && (
            <div className="divide-y divide-slate-800">
              {loads.filter(l => favorites.has(l.id)).map(load => (
                <div key={load.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-900 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400 font-mono border border-amber-900/50 px-2 py-0.5 rounded">{load.charge}gr</span>
                    <div>
                      <span className="text-sm text-white">{load.bulletId}</span>
                      {load.powderId && <span className="text-xs text-slate-500 ml-2">{load.powderId}</span>}
                    </div>
                  </div>
                  <button onClick={() => toggleFavorite(load.id)} className="text-amber-400 hover:text-slate-500 transition-colors p-1">
                    <Star className="w-3.5 h-3.5" style={{ fill: 'currentColor' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {(() => {
          const bulletGroups = new Map<string, Load[]>();
          loads.forEach(load => {
            const key = load.bulletId || 'Unknown Bullet';
            if (!bulletGroups.has(key)) bulletGroups.set(key, []);
            bulletGroups.get(key)!.push(load);
          });
          return Array.from(bulletGroups.entries()).map(([bullet, bulletLoads]) => {
            const isOpen = expandedBullets.has(bullet);
            return (
              <div key={bullet} className="border border-slate-800 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 hover:bg-slate-800 transition-colors text-left"
                  onClick={() => setExpandedBullets(prev => { const n = new Set(prev); if (n.has(bullet)) n.delete(bullet); else n.add(bullet); return n; })}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{bullet}</span>
                    <span className="text-xs text-slate-500">{bulletLoads.length} {bulletLoads.length === 1 ? 'recipe' : 'recipes'}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-800/50">
                    {bulletLoads.map((load) => (
                      <div key={load.id}>
                        {editingId === load.id ? (
                          <div className="p-4 bg-slate-900 border-l-2 border-amber-600 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Editing Recipe</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-slate-400 hover:text-white p-1 h-8 w-8"><X className="w-4 h-4" /></Button>
                                <Button size="sm" onClick={saveEdit} className="bg-amber-600 hover:bg-amber-700 p-1 h-8 w-8"><Save className="w-4 h-4" /></Button>
                              </div>
                            </div>
                            <LoadForm data={editForm} onChange={(field, value) => setEditForm({ ...editForm, [field]: value })} />
                          </div>
                        ) : (
                          <div className="bg-slate-950">
                            <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900 transition-colors cursor-pointer"
                              onClick={() => setExpandedId(expandedId === load.id ? null : load.id)}>
                              <div className="flex items-center gap-3">
                                <span className="inline-block text-amber-400 text-xs font-bold border border-amber-900/50 px-2 py-0.5 rounded min-w-[56px] text-center font-mono">{load.charge}gr</span>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                  {load.powderId && <span className="text-xs"><span className="text-slate-600">Powder: </span><span className="text-slate-400">{load.powderId}</span></span>}
                                  {load.caseId && <span className="text-xs"><span className="text-slate-600">Brass: </span><span className="text-slate-400">{load.caseId}</span></span>}
                                  {load.primerId && <span className="text-xs"><span className="text-slate-600">Primer: </span><span className="text-slate-400">{load.primerId}</span></span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Button size="sm" variant="ghost" onClick={() => toggleFavorite(load.id)}
                                  className={`h-8 w-8 p-0 ${favorites.has(load.id) ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-amber-400'} hover:bg-slate-700`}>
                                  <Star className="w-4 h-4" style={{ fill: favorites.has(load.id) ? 'currentColor' : 'none' }} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => copyLoad(load)} className="text-slate-400 hover:text-amber-400 hover:bg-slate-700 h-8 w-8 p-0"><Copy className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => startEdit(load)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteLoad(load.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                            {expandedId === load.id && (
                              <div className="px-4 pb-4 pt-1 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {load.primerId && <div><span className="text-slate-500 block text-xs mb-0.5">Primer</span><span className="text-white">{load.primerId}</span></div>}
                                {load.oal ? <div><span className="text-slate-500 block text-xs mb-0.5">OAL</span><span className="text-white">{load.oal}"</span></div> : null}
                                {load.seatingDepthIn ? <div><span className="text-slate-500 block text-xs mb-0.5">Seating Depth</span><span className="text-white">{load.seatingDepthIn}"</span></div> : null}
                                {load.neckTensionIn ? <div><span className="text-slate-500 block text-xs mb-0.5">Neck Tension</span><span className="text-white">{load.neckTensionIn}"</span></div> : null}
                                {load.notes && <div className="col-span-2 md:col-span-4"><span className="text-slate-500 block text-xs mb-0.5">Notes</span><span className="text-slate-300 italic">{load.notes}</span></div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      {loads.length === 0 && !isAdding && (
        <div
          onClick={() => setIsAdding(true)}
          className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
        >
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Add your first load recipe</p>
          <p className="text-sm">Click to start documenting your loads.</p>
        </div>
      )}
    </div>
  );
}