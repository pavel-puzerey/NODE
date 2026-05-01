import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

// Shared fields for both rifle types
const SharedFields = ({ data, onChange }: RifleFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Caliber</Label>
      <Input value={data.caliber || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('caliber', e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="6.5 Creedmoor" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Action / Model</Label>
      <Input value={data.action || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('action', e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder={(data as any).rifleType === 'gas' ? 'CMMG Resolute' : 'Zermatt Origin'} />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Brand</Label>
      <Input value={data.barrelBrand || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('barrelBrand', e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="Bartlein" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Length (in)</Label>
      <Input type="number" value={data.barrelLength || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('barrelLength', parseFloat(e.target.value))} className="bg-slate-950 border-slate-700 text-white" placeholder="20" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Chassis / Stock</Label>
      <Input value={data.chassis || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('chassis', e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder={(data as any).rifleType === 'gas' ? 'Magpul PRS' : 'MDT ACC Elite'} />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Trigger</Label>
      <Input value={data.trigger || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('trigger', e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder={(data as any).rifleType === 'gas' ? 'Geissele SSA-E' : 'TriggerTech Diamond'} />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Trigger Weight (lbs)</Label>
      <Input type="number" step="0.1" value={(data as any).triggerWeightLbs || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('triggerWeightLbs' as any, parseFloat(e.target.value))} className="bg-slate-950 border-slate-700 text-white" placeholder="2.5" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Barrel Life Warning (rounds)</Label>
      <Input type="number" value={(data as any).barrelLifeRounds || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('barrelLifeRounds' as any, parseInt(e.target.value))} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. 2500" />
    </div>
  </div>
);

// Gas-operated specific fields
const GasFields = ({ data, onChange }: RifleFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Gas System Length</Label>
      <select
        value={(data as any).gasSystemLength || ''}
        onChange={(e) => onChange('gasSystemLength' as any, e.target.value)}
        className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 text-white text-sm px-3 focus:outline-none focus:border-amber-600"
      >
        <option value="">Select…</option>
        <option value="Pistol">Pistol</option>
        <option value="Carbine">Carbine</option>
        <option value="Mid-length">Mid-length</option>
        <option value="Rifle">Rifle</option>
      </select>
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Gas Block Type</Label>
      <select
        value={(data as any).gasBlockType || ''}
        onChange={(e) => onChange('gasBlockType' as any, e.target.value)}
        className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 text-white text-sm px-3 focus:outline-none focus:border-amber-600"
      >
        <option value="">Select…</option>
        <option value="Low-profile">Low-profile</option>
        <option value="Standard">Standard</option>
        <option value="Adjustable">Adjustable</option>
      </select>
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">BCG Type</Label>
      <Input value={(data as any).bcgType || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('bcgType' as any, e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. BCM Enhanced, Nickel Boron" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Buffer Type</Label>
      <select
        value={(data as any).bufferType || ''}
        onChange={(e) => onChange('bufferType' as any, e.target.value)}
        className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 text-white text-sm px-3 focus:outline-none focus:border-amber-600"
      >
        <option value="">Select…</option>
        <option value="Carbine">Carbine</option>
        <option value="H">H</option>
        <option value="H2">H2</option>
        <option value="H3">H3</option>
        <option value="Rifle">Rifle</option>
        <option value="LUTH-AR MBA">LUTH-AR MBA</option>
      </select>
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Buffer Spring</Label>
      <Input value={(data as any).bufferSpring || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('bufferSpring' as any, e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. Sprinco Silver" />
    </div>
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Handguard</Label>
      <Input value={(data as any).handguard || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('handguard' as any, e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. Midwest Industries 15in M-LOK" />
    </div>
  </div>
);

// Alias for backward compatibility
const RifleFields = SharedFields;

interface RifleManagerProps {
  rifles: Rifle[];
  setRifles: (rifles: Rifle[] | ((prev: Rifle[]) => Rifle[])) => void;
  sessions?: any[];
}

export function RifleManager({ rifles, setRifles, sessions = [] }: RifleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [hoveredRifleId, setHoveredRifleId] = useState<string | null>(null);

  // Load photos from Supabase storage on mount / rifle changes
  useEffect(() => {
    const loadPhotos = async () => {
      const newImages: Record<string, string> = {};
      for (const rifle of rifles) {
        const path = `rifle-photos/${rifle.id}.jpg`;
        const { data } = supabase.storage.from('rifle-photos').getPublicUrl(path);
        if (data?.publicUrl) {
          // Check if file exists by trying to fetch it
          try {
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) newImages[rifle.id] = data.publicUrl + '?t=' + Date.now();
          } catch {}
        }
      }
      setRifleImages(newImages);
    };
    if (rifles.length > 0) loadPhotos();
  }, [rifles.map(r => r.id).join(',')]);

  const uploadPhoto = async (rifleId: string, dataUrl: string): Promise<string | null> => {
    setPhotoUploading(true);
    try {
      const base64 = dataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { error } = await supabase.storage
        .from('rifle-photos')
        .upload(`rifle-photos/${rifleId}.jpg`, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) { console.error('Photo upload error:', error); return null; }
      const { data } = supabase.storage.from('rifle-photos').getPublicUrl(`rifle-photos/${rifleId}.jpg`);
      return data.publicUrl + '?t=' + Date.now();
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async (rifleId: string) => {
    await supabase.storage.from('rifle-photos').remove([`rifle-photos/${rifleId}.jpg`]);
    setRifleImages(prev => { const n = { ...prev }; delete n[rifleId]; return n; });
  };
  const [rifleTypeFilter, setRifleTypeFilter] = useState<'bolt' | 'gas'>('bolt');
  const [rifleImages, setRifleImages] = useState<Record<string, string>>({});
  const [newRifleImage, setNewRifleImage] = useState<string>('');
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
      rifleType: rifleTypeFilter,
      createdAt: new Date().toISOString(),
    } as any;

    setRifles([...rifles, rifle]);
    if (newRifleImage) {
      uploadPhoto(rifle.id, newRifleImage).then(url => {
        if (url) setRifleImages(prev => ({ ...prev, [rifle.id]: url }));
      });
    }
    setNewRifle({
      action: '',
      caliber: '',
      barrelBrand: '',
      barrelLength: 0,
      chassis: '',
      trigger: '',
    });
    setIsAdding(false);
    setNewRifleImage('');
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
    // Upload pending photo if set during edit
    const pendingImg = (editForm as any).__pendingPhoto;
    if (pendingImg && editingId) {
      const id = editingId;
      uploadPhoto(id, pendingImg).then(url => {
        if (url) setRifleImages(prev => ({ ...prev, [id]: url }));
      });
    }
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Rifle Inventory</h2>
          <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-md p-1">
            {(['bolt', 'gas'] as const).map(t => (
              <button key={t} onClick={() => setRifleTypeFilter(t)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-colors ${rifleTypeFilter === t ? 'text-slate-900' : 'text-slate-500 hover:text-white'}`}
                style={rifleTypeFilter === t ? { backgroundColor: '#f59e0b' } : {}}
              >
                {t === 'bolt' ? 'Bolt Action' : 'Gas-Operated'}
              </button>
            ))}
          </div>
        </div>
        {!isAdding && rifles.length > 0 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Rifle
          </button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-slate-800 border-slate-700 border-2 border-dashed border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Add New Rifle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SharedFields data={{ ...newRifle, rifleType: rifleTypeFilter } as any} onChange={(field, value) => setNewRifle({ ...newRifle, [field]: value, rifleType: rifleTypeFilter } as any)} />
            {rifleTypeFilter === 'gas' && (
              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Gas System</p>
                <GasFields data={{ ...newRifle, rifleType: rifleTypeFilter } as any} onChange={(field, value) => setNewRifle({ ...newRifle, [field]: value } as any)} />
              </div>
            )}
            <div className="pt-2 border-t border-slate-800">
              {newRifleImage ? (
                <div className="relative group/img inline-block" style={{ width: '25%' }}>
                  <img src={newRifleImage} alt="Rifle" className="w-full h-auto object-contain rounded-lg border border-slate-700 bg-slate-950 block" />
                  <label className="absolute bottom-2 right-2 cursor-pointer bg-amber-600 hover:bg-amber-500 rounded-md px-2 py-1 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-white" /><span className="text-white text-xs font-semibold">Replace</span>
                    <input type="file" accept="image/*" className="hidden"
                      onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewRifleImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                </div>
              ) : (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-md transition-colors">
                  <Camera className="w-3.5 h-3.5" />Add Rifle Photo
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setNewRifleImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="w-4 h-4 mr-2" />Save Rifle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {rifles.filter(r => ((r as any).rifleType || 'bolt') === rifleTypeFilter).map((rifle) => (
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
                <SharedFields data={editForm as any} onChange={(field, value) => setEditForm({ ...editForm, [field]: value })} />
                {((editForm as any).rifleType === 'gas') && (
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Gas System</p>
                    <GasFields data={editForm as any} onChange={(field, value) => setEditForm({ ...editForm, [field]: value } as any)} />
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800">
                  {(rifleImages[editingId!] || (editForm as any).__pendingPhoto) ? (
                    <div className="flex items-end gap-3">
                      <div className="relative group/img inline-block" style={{ width: '25%' }}>
                        <img src={(editForm as any).__pendingPhoto || rifleImages[editingId!]} alt="Rifle"
                          className="w-full h-auto object-contain rounded-lg border border-slate-700 bg-slate-950 block" />
                        <label className="absolute bottom-2 right-2 cursor-pointer bg-amber-600 hover:bg-amber-500 rounded-md px-2 py-1 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-white" /><span className="text-white text-xs font-semibold">Replace</span>
                          <input type="file" accept="image/*" className="hidden"
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => setEditForm(prev => ({ ...prev, __pendingPhoto: ev.target?.result as string } as any));
                              reader.readAsDataURL(file);
                            }} />
                        </label>
                      </div>
                      <button
                        onClick={() => { deletePhoto(editingId!); setEditForm(prev => { const n = { ...prev } as any; delete n.__pendingPhoto; return n; }); }}
                        className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 mb-1"
                      >
                        <X className="w-3 h-3" /> Delete Photo
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-md transition-colors">
                      <Camera className="w-3.5 h-3.5" />Add Rifle Photo
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setEditForm(prev => ({ ...prev, __pendingPhoto: ev.target?.result as string } as any));
                          reader.readAsDataURL(file);
                        }} />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors">
                <div className="flex items-center gap-3">
                  <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[100px] text-center">
                    {rifle.caliber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                    <div className="font-medium text-white text-sm">{rifle.action}</div>
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest">{((rifle as any).rifleType || 'bolt') === 'gas' ? 'Gas' : 'Bolt'}</span>
                  </div>
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
                      {(rifle as any).gasSystemLength && (
                        <span className="text-xs"><span className="text-slate-600">Gas: </span><span className="text-slate-400">{(rifle as any).gasSystemLength}</span></span>
                      )}
                      {(rifle as any).bufferType && (
                        <span className="text-xs"><span className="text-slate-600">Buffer: </span><span className="text-slate-400">{(rifle as any).bufferType}</span></span>
                      )}
                      {(rifle as any).handguard && (
                        <span className="text-xs"><span className="text-slate-600">Handguard: </span><span className="text-slate-400">{(rifle as any).handguard}</span></span>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rifleImages[rifle.id] && (
                    <div className="relative"
                      onMouseEnter={() => setHoveredRifleId(rifle.id)}
                      onMouseLeave={() => setHoveredRifleId(null)}
                    >
                      <img
                        src={rifleImages[rifle.id]}
                        alt="Rifle"
                        style={{ width: 72, height: 'auto', cursor: 'zoom-in' }}
                        className="object-contain rounded border border-slate-700 bg-slate-950 block"
                      />
                      {hoveredRifleId === rifle.id && (
                        <div className="absolute z-50 bottom-0 right-full mr-2 pointer-events-none"
                          style={{ width: 220 }}>
                          <img
                            src={rifleImages[rifle.id]}
                            alt="Rifle enlarged"
                            className="w-full h-auto object-contain rounded-lg border border-slate-600 bg-slate-950 shadow-2xl"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(rifle)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRifle(rifle.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
          <p className="text-lg font-medium text-slate-400">Add your first {rifleTypeFilter === 'gas' ? 'gas-operated' : 'bolt action'} rifle</p>
          <p className="text-sm">Click to start tracking rifle inventory.</p>
        </div>
      )}
    </div>
  );
}