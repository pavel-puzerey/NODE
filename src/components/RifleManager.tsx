import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Edit, Trash2, Save, X, Crosshair } from 'lucide-react';
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
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Trigger Weight (lbs)</Label>
      <Input 
        type="number"
        step="0.1"
        value={(data as any).triggerWeightLbs || ''} 
        onChange={(e) => onChange('triggerWeightLbs' as any, parseFloat(e.target.value))}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="2.5" 
      />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Life Warning (rounds)</Label>
      <Input 
        type="number"
        value={(data as any).barrelLifeRounds || ''} 
        onChange={(e) => onChange('barrelLifeRounds' as any, parseInt(e.target.value))}
        className="bg-slate-950 border-slate-700 text-white" 
        placeholder="e.g. 2500" 
      />
    </div>
  </div>
);

interface RifleManagerProps {
  rifles: Rifle[];
  setRifles: (rifles: Rifle[] | ((prev: Rifle[]) => Rifle[])) => void;
  sessions?: any[];
}

export function RifleManager({ rifles, setRifles, sessions = [] }: RifleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
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

  const roundCountMap: Record<string, number> = {};
  sessions.forEach((session: any) => {
    if (!session.rifleId) return;
    const rounds = (session.groups || []).reduce((sum: number, g: any) => sum + (g.rounds || 0), 0);
    roundCountMap[session.rifleId] = (roundCountMap[session.rifleId] || 0) + rounds;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Rifle Inventory</h2>
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

      <div className="space-y-2">
        {rifles.map((rifle) => (
          <div key={rifle.id}>
            {editingId === rifle.id ? (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Editing Rifle</span>
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
              </div>
            ) : (
              <div className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors">
                <div className="flex items-center gap-3">
                  <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[100px] text-center">
                    {rifle.caliber}
                  </span>
                  <div>
                    <div className="font-medium text-white text-sm">{rifle.action}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      {rifle.barrelBrand && (
                        <span className="text-xs">
                          <span className="text-slate-600">Barrel: </span>
                          <span className="text-slate-400">{rifle.barrelBrand}</span>
                        </span>
                      )}
                      {rifle.barrelLength ? (
                        <span className="text-xs">
                          <span className="text-slate-600">Length: </span>
                          <span className="text-slate-400">{rifle.barrelLength}"</span>
                        </span>
                      ) : null}
                      {rifle.chassis && (
                        <span className="text-xs">
                          <span className="text-slate-600">Chassis: </span>
                          <span className="text-slate-400">{rifle.chassis}</span>
                        </span>
                      )}
                      {rifle.trigger && (
                        <span className="text-xs">
                          <span className="text-slate-600">Trigger: </span>
                          <span className="text-slate-400">{rifle.trigger}</span>
                        </span>
                      )}
                      {(rifle as any).triggerWeightLbs && (
                        <span className="text-xs">
                          <span className="text-slate-600">Trigger Weight: </span>
                          <span className="text-slate-400">{(rifle as any).triggerWeightLbs} lbs</span>
                        </span>
                      )}
                    </div>
                    {/* Round count */}
                    {(() => {
                      const count = roundCountMap[rifle.id] || 0;
                      const threshold = (rifle as any).barrelLifeRounds;
                      const pct = threshold ? count / threshold : null;
                      const warn = pct !== null && pct >= 0.9;
                      const critical = pct !== null && pct >= 1;
                      return (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: critical ? '#ef4444' : warn ? '#f59e0b' : '#475569' }}>
                            {count} rounds fired
                          </span>
                          {threshold && (
                            <>
                              <div className="flex-1 max-w-[120px] h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (pct! * 100))}%`,
                                    backgroundColor: critical ? '#ef4444' : warn ? '#f59e0b' : '#334155',
                                  }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{threshold} limit</span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
<Button size="sm" variant="ghost" onClick={() => startEdit(rifle)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteRifle(rifle.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
      
      {rifles.length === 0 && !isAdding && (
        <div
          onClick={() => setIsAdding(true)}
          className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
        >
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Add your first rifle</p>
          <p className="text-sm">Click to start tracking data.</p>
        </div>
      )}
    </div>
  );
}