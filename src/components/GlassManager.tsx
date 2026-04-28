import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Glasses, Crosshair, Eye, Ruler, Camera, Edit2 } from 'lucide-react';
import { Glass } from '../types';
import { generateId } from '../utils/id';

interface GlassManagerProps {
  glass: Glass[];
  setGlass: (glass: Glass[] | ((prev: Glass[]) => Glass[])) => void;
}

export function GlassManager({ glass, setGlass }: GlassManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [reticleUploadId, setReticleUploadId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<string>('rifle-scope');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [magnification, setMagnification] = useState('');
  const [reticle, setReticle] = useState('');
  const [tubeSize, setTubeSize] = useState('');
  const [turretType, setTurretType] = useState('');
  const [objectiveLens, setObjectiveLens] = useState('');
  const [eyepiece, setEyepiece] = useState('');
  const [hasReticle, setHasReticle] = useState(false);
  const [prismType, setPrismType] = useState<'Roof' | 'Porro'>('Roof');
  const [fieldOfView, setFieldOfView] = useState('');
  const [binoMagnification, setBinoMagnification] = useState('');
  const [weight, setWeight] = useState('');
  const [maxRange, setMaxRange] = useState('');
  const [angleComp, setAngleComp] = useState(false);
  const [ballisticCalc, setBallisticCalc] = useState(false);
  const [notes, setNotes] = useState('');
  const [reticleImage, setReticleImage] = useState<string | null>(null);

  useEffect(() => {
    if (reticleUploadId) {
      const input = document.getElementById('reticle-upload-input') as HTMLInputElement;
      if (input) input.click();
    }
  }, [reticleUploadId]);

  const getTypeIcon = (glassType: string) => {
    switch (glassType) {
      case 'rifle-scope': return <Crosshair className="w-4 h-4 text-amber-400" />;
      case 'spotting-scope': return <Search className="w-4 h-4 text-amber-400" />;
      case 'binoculars': return <Glasses className="w-4 h-4 text-amber-400" />;
      case 'rangefinder': return <Ruler className="w-4 h-4 text-amber-400" />;
      case 'red-dot': return <Crosshair className="w-4 h-4 text-amber-400" />;
      case 'prism-scope': return <Crosshair className="w-4 h-4 text-amber-400" />;
      default: return <Eye className="w-4 h-4 text-amber-400" />;
    }
  };

  const getTypeLabel = (glassType: string) => {
    switch (glassType) {
      case 'rifle-scope': return 'Rifle Scope';
      case 'spotting-scope': return 'Spotting Scope';
      case 'binoculars': return 'Binoculars';
      case 'rangefinder': return 'Rangefinder';
      case 'red-dot': return 'Red Dot';
      case 'prism-scope': return 'Prism Scope';
      default: return 'Glass';
    }
  };

  const handleAdd = () => {
    if (!brand || !model) return;

    const item: any = {
      id: editingId || generateId(),
      userId: 'user-1',
      type,
      brand,
      model,
      magnification: (type === 'rifle-scope' || type === 'prism-scope') ? magnification : undefined,
      reticle: (type === 'rifle-scope' || type === 'red-dot' || type === 'prism-scope') ? reticle : undefined,
      tubeSize: (type === 'rifle-scope' || type === 'red-dot' || type === 'prism-scope') ? tubeSize : undefined,
      turretType: type === 'rifle-scope' ? turretType : undefined,
      objectiveLens: type === 'spotting-scope' ? objectiveLens : undefined,
      eyepiece: type === 'spotting-scope' ? eyepiece : undefined,
      hasReticle: type === 'spotting-scope' ? hasReticle : undefined,
      prismType: type === 'binoculars' ? prismType : undefined,
      fieldOfView: type === 'binoculars' ? fieldOfView : undefined,
      binoMagnification: type === 'binoculars' ? binoMagnification : undefined,
      weight: type === 'binoculars' ? weight : undefined,
      maxRange: type === 'rangefinder' ? maxRange : undefined,
      angleComp: type === 'rangefinder' ? angleComp : undefined,
      ballisticCalc: type === 'rangefinder' ? ballisticCalc : undefined,
      notes,
      reticleImage: reticleImage || undefined,
      createdAt: editingId ? (glass.find(g => g.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) {
      setGlass(glass.map(g => g.id === editingId ? item : g));
    } else {
      setGlass([...glass, item]);
    }
    resetForm();
  };

  const startEdit = (item: Glass) => {
    setEditingId(item.id);
    setType(item.type);
    setBrand(item.brand);
    setModel(item.model);
    setMagnification(item.magnification || '');
    setReticle(item.reticle || '');
    setTubeSize(item.tubeSize || '');
    setTurretType(item.turretType || '');
    setObjectiveLens(item.objectiveLens || '');
    setEyepiece(item.eyepiece || '');
    setHasReticle(item.hasReticle || false);
    setPrismType(item.prismType || 'Roof');
    setFieldOfView(item.fieldOfView || '');
    setBinoMagnification((item as any).binoMagnification || '');
    setWeight(item.weight || '');
    setMaxRange(item.maxRange || '');
    setAngleComp(item.angleComp || false);
    setBallisticCalc(item.ballisticCalc || false);
    setNotes(item.notes || '');
    setReticleImage((item as any)?.reticleImage || null);
    setIsAdding(true);
    setExpandedId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setGlass(glass.filter(g => g.id !== id));
    }
  };

  const resetForm = () => {
    setBrand('');
    setModel('');
    setMagnification('');
    setReticle('');
    setTubeSize('');
    setTurretType('');
    setObjectiveLens('');
    setEyepiece('');
    setHasReticle(false);
    setPrismType('Roof');
    setFieldOfView('');
    setBinoMagnification('');
    setWeight('');
    setMaxRange('');
    setAngleComp(false);
    setBallisticCalc(false);
    setNotes('');
    setReticleImage(null);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Glass Manager</h2>
        </div>
        {!isAdding && glass.length > 0 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Optic
          </button>
        )}
      </div>

      {/* Add New Glass Card */}
      {isAdding && <Card className="bg-slate-900 border-slate-800 card-tactical">
        <CardHeader>
          <CardTitle className="text-white">{editingId ? 'Edit Optic' : 'Add New Glass'}</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the details of your new optic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="rifle-scope">Rifle Scope</SelectItem>
                  <SelectItem value="spotting-scope">Spotting Scope</SelectItem>
                  <SelectItem value="binoculars">Binoculars</SelectItem>
                  <SelectItem value="rangefinder">Rangefinder</SelectItem>
                  <SelectItem value="red-dot">Red Dot</SelectItem>
                  <SelectItem value="prism-scope">Prism Scope</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Brand</Label>
              <Input
                value={brand}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBrand(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder={({'rifle-scope':'e.g. Vortex','spotting-scope':'e.g. Swarovski','binoculars':'e.g. Leica','rangefinder':'e.g. Leica','red-dot':'e.g. Aimpoint','prism-scope':'e.g. Trijicon'} as Record<string,string>)[type] || 'Brand'}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Model</Label>
              <Input
                value={model}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setModel(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder={({'rifle-scope':'e.g. PST Gen II 5-25x50','spotting-scope':'e.g. ATX 85','binoculars':'e.g. Noctivid 10x42','rangefinder':'e.g. Rangemaster CRF 3500.COM','red-dot':'e.g. CompM5','prism-scope':'e.g. ACOG 4x32'} as Record<string,string>)[type] || 'Model'}
              />
            </div>
          </div>

          {/* Type Specific Fields */}
          {type === 'rifle-scope' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Magnification</Label>
                <Input
                  value={magnification}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMagnification(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 5-25x"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Reticle</Label>
                <Input
                  value={reticle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReticle(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. EBR-2C"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Reticle Photo</Label>
                {reticleImage ? (
                  <div className="relative group">
                    <img src={reticleImage} alt="Reticle" className="w-full h-32 object-contain rounded-lg border border-slate-700 bg-slate-950" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                      <Camera className="w-5 h-5 text-white mr-1" />
                      <span className="text-white text-xs">Change</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setReticleImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-amber-600 transition-colors text-slate-500 hover:text-amber-500 text-xs bg-slate-950">
                    <Camera className="w-4 h-4" />
                    Upload reticle image
                    <input type="file" accept="image/*" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setReticleImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tube Size</Label>
                <Input
                  value={tubeSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTubeSize(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 30mm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Turret Type</Label>
                <Input
                  value={turretType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTurretType(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. Zero Stop"
                />
              </div>
            </div>
          )}

          {type === 'spotting-scope' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Objective Lens</Label>
                <Input
                  value={objectiveLens}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setObjectiveLens(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 60mm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Eyepiece</Label>
                <Input
                  value={eyepiece}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEyepiece(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 20-60x"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="hasReticle"
                  checked={hasReticle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHasReticle(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-emerald-600"
                />
                <Label htmlFor="hasReticle" className="text-slate-300">Has Reticle</Label>
              </div>
            </div>
          )}

          {type === 'binoculars' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Magnification × Objective (mm)</Label>
                <Input
                  value={binoMagnification}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBinoMagnification(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 10x42"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Prism Type</Label>
                <Select value={prismType} onValueChange={(val: any) => setPrismType(val)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="Roof">Roof</SelectItem>
                    <SelectItem value="Porro">Porro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Field of View</Label>
                <Input
                  value={fieldOfView}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFieldOfView(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 369ft @ 1000yds"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Weight</Label>
                <Input
                  value={weight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setWeight(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 28 oz"
                />
              </div>
            </div>
          )}

          {type === 'rangefinder' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max Range</Label>
                <Input
                  value={maxRange}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMaxRange(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g. 2000 yards"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="angleComp"
                  checked={angleComp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAngleComp(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-emerald-600"
                />
                <Label htmlFor="angleComp" className="text-slate-300">Angle Compensation</Label>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="ballisticCalc"
                  checked={ballisticCalc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBallisticCalc(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-emerald-600"
                />
                <Label htmlFor="ballisticCalc" className="text-slate-300">Ballistic Calculator</Label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Input
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />{editingId ? 'Update Optic' : 'Add Glass'}
            </Button>
            <Button onClick={() => { resetForm(); setIsAdding(false); }} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>}

      {/* Glass List - Compact Buttons */}
      <div className="space-y-2">      
        {glass.length === 0 && !isAdding ? (
          <div
            onClick={() => setIsAdding(true)}
            className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-600 hover:bg-slate-900/50 transition-colors"
          >
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium text-slate-400">Add your first optic</p>
            <p className="text-sm">Click to start tracking glass.</p>
          </div>
        ) : (
          glass.map((item) => (
            <div key={item.id} className="w-full">
              {/* Expandable Button */}
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-2 py-0.5 rounded min-w-[120px] text-center">
                    {getTypeLabel(item.type)}
                  </span>
                  <div>
                    <div className="font-medium text-white text-sm">
                      {item.brand} {item.model}
                    </div>
                    {item.magnification && (
                      <div className="text-xs text-slate-400">{item.magnification}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      startEdit(item);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedId === item.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="mt-1 p-4 bg-slate-900 border border-slate-700 border-t-0 rounded-b-md animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Type</span>
                      <span className="text-white">{getTypeLabel(item.type)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Brand</span>
                      <span className="text-white">{item.brand}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Model</span>
                      <span className="text-white">{item.model}</span>
                    </div>
                    
                    {/* Type Specific Details */}
                    {item.type === 'rifle-scope' && (
                      <>
                        {item.magnification && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Magnification</span>
                            <span className="text-white">{item.magnification}</span>
                          </div>
                        )}
                        {item.reticle && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Reticle</span>
                            <span className="text-white">{item.reticle}</span>
                          </div>
                        )}
                        {(item as any).reticleImage && (
                          <div className="col-span-2 md:col-span-4 mt-2">
                            <span className="text-slate-500 block text-xs mb-1">Reticle Image</span>
                            <img
                              src={(item as any).reticleImage}
                              alt="Reticle"
                              className="w-full max-h-48 object-contain rounded-lg border border-slate-700 bg-slate-950 block pointer-events-none"
                            />
                            <div className="mt-1 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setZoomedImage((item as any).reticleImage!); }}
                                className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                              >
                                🔍 View enlarged
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setReticleUploadId(item.id); }}
                                className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
                              >
                                📷 Change photo
                              </button>
                            </div>
                          </div>
                        )}
                        {item.tubeSize && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Tube Size</span>
                            <span className="text-white">{item.tubeSize}</span>
                          </div>
                        )}
                        {item.turretType && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Turret Type</span>
                            <span className="text-white">{item.turretType}</span>
                          </div>
                        )}
                      </>
                    )}

                    {item.type === 'spotting-scope' && (
                      <>
                        {item.objectiveLens && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Objective Lens</span>
                            <span className="text-white">{item.objectiveLens}</span>
                          </div>
                        )}
                        {item.eyepiece && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Eyepiece</span>
                            <span className="text-white">{item.eyepiece}</span>
                          </div>
                        )}
                        {item.hasReticle !== undefined && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Reticle</span>
                            <span className="text-white">{item.hasReticle ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </>
                    )}

                    {item.type === 'binoculars' && (
                      <>
                        {(item as any).binoMagnification && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Magnification × Objective</span>
                            <span className="text-white">{(item as any).binoMagnification}</span>
                          </div>
                        )}
                        {item.prismType && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Prism Type</span>
                            <span className="text-white">{item.prismType}</span>
                          </div>
                        )}
                        {item.fieldOfView && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Field of View</span>
                            <span className="text-white">{item.fieldOfView}</span>
                          </div>
                        )}
                        {item.weight && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Weight</span>
                            <span className="text-white">{item.weight}</span>
                          </div>
                        )}
                      </>
                    )}

                    {item.type === 'rangefinder' && (
                      <>
                        {item.maxRange && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Max Range</span>
                            <span className="text-white">{item.maxRange}</span>
                          </div>
                        )}
                        {item.angleComp !== undefined && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Angle Comp</span>
                            <span className="text-white">{item.angleComp ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {item.ballisticCalc !== undefined && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1">Ballistic Calc</span>
                            <span className="text-white">{item.ballisticCalc ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {item.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <span className="text-slate-500 block text-xs mb-1">Notes</span>
                      <p className="text-slate-300 text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Hidden file input for reticle photo change */}
      <input
        id="reticle-upload-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file || !reticleUploadId) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setGlass(glass.map(g =>
              g.id === reticleUploadId ? { ...g, reticleImage: ev.target?.result as string } : g
            ));
            setReticleUploadId(null);
          };
          reader.readAsDataURL(file);
          (e.target as HTMLInputElement).value = '';
        }}
      />

      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white text-sm tracking-widest uppercase"
            >
              Close ✕
            </button>
            <img
              src={zoomedImage}
              alt="Reticle zoomed"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}