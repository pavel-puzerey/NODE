import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { generateId } from '../utils/id';

// ── Types ──────────────────────────────────────────────────────────────────

type SharpieColor = { name: string; hex: string };
type MarkShape = 'none' | 'dot' | 'line' | 'two-lines' | 'three-lines' | 'single-line-cross' | 'double-line-cross';

interface BrassScheme {
  id: string;
  name: string;
  caliber: string;
  bodyColor: string;        // hex — stripe on case body
  bodyColorName: string;
  grooveColor: string;      // hex — extractor groove band
  grooveColorName: string;
  headColor: string;        // hex — mark on case head face
  headColorName: string;
  headShape: MarkShape;
  maxFirings: number;
  notes: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const SHARPIE_COLORS: SharpieColor[] = [
  { name: 'Black',   hex: '#080808' },
  { name: 'Red',     hex: '#e02020' },
  { name: 'Blue',    hex: '#1a5fd4' },
  { name: 'Green',   hex: '#1a8a2e' },
  { name: 'Orange',  hex: '#e86a00' },
  { name: 'Purple',  hex: '#7b22b8' },
  { name: 'Brown',   hex: '#4a2208' },
  { name: 'Yellow',  hex: '#f5c800' },
  { name: 'Pink',    hex: '#e0308c' },
  { name: 'None',    hex: 'none'    },
];

const HEAD_SHAPES: { value: MarkShape; label: string }[] = [
  { value: 'none',              label: 'None' },
  { value: 'dot',               label: 'Dot' },
  { value: 'line',              label: 'Line' },
  { value: 'two-lines',         label: 'Two lines' },
  { value: 'three-lines',       label: 'Three lines' },
  { value: 'single-line-cross', label: 'Single-line cross' },
  { value: 'double-line-cross', label: 'Double-line cross' },
];

// ── SVG Case Schematic ────────────────────────────────────────────────────

function CaseSideView({
  bodyColor, bodyColorName,
  grooveColor, grooveColorName,
}: {
  bodyColor: string; bodyColorName: string;
  grooveColor: string; grooveColorName: string;
}) {
  const hasBody   = bodyColor   !== 'none';
  const hasGroove = grooveColor !== 'none';

  // ── Traced directly from the CIP 6.5 Creedmoor drawing ───────────────
  // Source image: case body spans y≈108→760 (652px), x≈232→418 (186px wide)
  // Each zone measured as px from top of case, converted to % of 652:
  //
  //  Zone            src-px   %      → SVG y (viewBox height=200, cx=30)
  //  Mouth cap       0– 4     0–1%   → 0–2
  //  Neck            4– 64   1–10%   → 2–20    (short, narrow)
  //  Shoulder       64–108  10–17%   → 20–34   (steep, wide flare)
  //  Body          108–530  17–81%   → 34–162  (long dominant cylinder)
  //  Web taper     530–558  81–86%   → 162–172 (narrows inward)
  //  Extractor grv 558–590  86–91%   → 172–182 (recessed, narrowest)
  //  Head flare    590–604  91–93%   → 182–186 (splays back out)
  //  Case head     604–652  93–100%  → 186–200 (full width, flat base)
  //
  // Widths (half, from cx=30):
  //  Neck:   7   (≈37% of body — from image: neck≈70px, body≈186px)
  //  Body:   19
  //  Groove: 15  (≈79% of body width — clearly recessed)
  //  Head:   20  (barely wider — rimless case)

  const cx    = 30;
  const nkHW  = 10;    // +30% wider neck (was 7)
  const bdHW  = 19;
  const grHW  = 16;
  const hdHW  = 19;   // smaller than groove (was 20 — now truly recessed head)

  const mouthY    =   0;
  const neckBot   =  20;
  const bodyTop   =  34;
  const bodyBot   = 168;
  const webBot    = 174;  // web taper below body: 10px
  const grooveBot = 182;
  const headTop   = 188;  // flare above groove: also 10px (symmetric with web taper)
  const headBot   = 188;
  const baseBot   = 193;

  // Sharpie stripe — same visual weight as the groove band (narrow line)
  const stripeH   = grooveBot - webBot;  // match groove band height (~10px)
  const stripeMid = bodyTop + (bodyBot - bodyTop) * 0.55;
  const stripeTop = stripeMid - stripeH / 2;

  const fill   = '#2c2c2c';
  const stroke = '#505050';
  const sw     = 0.6;

  return (
    <svg viewBox="0 0 58 202" width="58" height="178" style={{ display: 'block', margin: '0 auto' }}>

      {/* Mouth cap */}
      <rect x={cx - nkHW} y={mouthY} width={nkHW * 2} height={2}
        fill="#484848" stroke={stroke} strokeWidth={sw} />

      {/* Neck */}
      <rect x={cx - nkHW} y={mouthY + 2} width={nkHW * 2} height={neckBot - mouthY - 2}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Shoulder — steep trapezoid */}
      <path d={`M${cx-nkHW},${neckBot} L${cx-bdHW},${bodyTop} L${cx+bdHW},${bodyTop} L${cx+nkHW},${neckBot} Z`}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Body */}
      <rect x={cx - bdHW} y={bodyTop} width={bdHW * 2} height={bodyBot - bodyTop}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Body stripe — narrow sharpie-width band */}
      {hasBody && (
        <rect x={cx - bdHW + 0.5} y={stripeTop} width={(bdHW - 0.5) * 2} height={stripeH}
          fill={bodyColor} opacity={0.95} />
      )}

      {/* Web taper */}
      <path d={`M${cx-bdHW},${bodyBot} L${cx-grHW},${webBot} L${cx+grHW},${webBot} L${cx+bdHW},${bodyBot} Z`}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Extractor groove */}
      <rect x={cx - grHW} y={webBot} width={grHW * 2} height={grooveBot - webBot}
        fill={hasGroove ? grooveColor : '#181818'} opacity={hasGroove ? 0.95 : 1}
        stroke={stroke} strokeWidth={sw} />
      {!hasGroove && <>
        <line x1={cx - grHW} y1={webBot + 0.5}    x2={cx + grHW} y2={webBot + 0.5}    stroke="#101010" strokeWidth="1" />
        <line x1={cx - grHW} y1={grooveBot - 0.5} x2={cx + grHW} y2={grooveBot - 0.5} stroke="#101010" strokeWidth="1" />
      </>}

      {/* Groove → head flare */}
      <path d={`M${cx-grHW},${grooveBot} L${cx-hdHW},${headTop} L${cx+hdHW},${headTop} L${cx+grHW},${grooveBot} Z`}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Case head */}
      <rect x={cx - hdHW} y={headTop} width={hdHW * 2} height={headBot - headTop}
        fill={fill} stroke={stroke} strokeWidth={sw} />

      {/* Base face */}
      <rect x={cx - hdHW} y={headBot} width={hdHW * 2} height={baseBot - headBot}
        fill="#3c3c3c" stroke={stroke} strokeWidth={sw} />

      {/* Left-edge sheen */}
      <line x1={cx - nkHW} y1={mouthY + 2} x2={cx - nkHW} y2={neckBot}  stroke="#5c5c5c" strokeWidth="0.5" />
      <line x1={cx - bdHW} y1={bodyTop}     x2={cx - bdHW} y2={bodyBot}  stroke="#5c5c5c" strokeWidth="0.5" />
      <line x1={cx - hdHW} y1={headTop}     x2={cx - hdHW} y2={headBot}  stroke="#5c5c5c" strokeWidth="0.5" />

    </svg>
  );
}

function CaseHeadView({ headColor, headColorName, headShape }: { headColor: string; headColorName: string; headShape: MarkShape }) {
  const hasHead = headColor !== 'none' && headShape !== 'none';
  const cx = 44, cy = 44, r = 40;
  const primerR = 16;
  // Marks extend to near the rim edge
  const markR = r - 5;

  const renderMark = () => {
    if (!hasHead) return null;
    const color = headColor;
    const sw = 3.5;
    switch (headShape) {
      case 'dot':
        return <circle cx={cx} cy={cy} r={5} fill={color} />;
      case 'line':
        return <line x1={cx - markR} y1={cy} x2={cx + markR} y2={cy}
          stroke={color} strokeWidth={sw} strokeLinecap="round" />;
      case 'two-lines':
        return <>
          <line x1={cx - markR} y1={cy - 7} x2={cx + markR} y2={cy - 7}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx - markR} y1={cy + 7} x2={cx + markR} y2={cy + 7}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>;
      case 'three-lines':
        return <>
          <line x1={cx - markR} y1={cy - 10} x2={cx + markR} y2={cy - 10}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx - markR} y1={cy}      x2={cx + markR} y2={cy}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx - markR} y1={cy + 10} x2={cx + markR} y2={cy + 10}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>;
      case 'single-line-cross':
        return <>
          <line x1={cx - markR} y1={cy} x2={cx + markR} y2={cy}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx} y1={cy - markR} x2={cx} y2={cy + markR}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>;
      case 'double-line-cross':
        return <>
          <line x1={cx - markR} y1={cy - 5} x2={cx + markR} y2={cy - 5}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx - markR} y1={cy + 5} x2={cx + markR} y2={cy + 5}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx - 5} y1={cy - markR} x2={cx - 5} y2={cy + markR}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={cx + 5} y1={cy - markR} x2={cx + 5} y2={cy + markR}
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 88 88" width="76" height="76" style={{ display: 'block', margin: '0 auto' }}>
      {/* Case head face */}
      <circle cx={cx} cy={cy} r={r} fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      {/* Headstamp ring */}
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#3a3a3a" strokeWidth="0.8" />
      {/* Line/cross marks drawn BEFORE primer — they pass behind it */}
      {headShape !== 'dot' && renderMark()}
      {/* Primer pocket */}
      <circle cx={cx} cy={cy} r={primerR} fill="#151515" stroke="#2a2a2a" strokeWidth="1" />
      {/* Dot drawn AFTER primer — sits on top of primer face */}
      {headShape === 'dot' && renderMark()}
    </svg>
  );
}

// ── Color Picker ──────────────────────────────────────────────────────────

function ColorPicker({ label, value, valueName, onChange }: {
  label: string;
  value: string;
  valueName: string;
  onChange: (hex: string, name: string) => void;
}) {
  const [custom, setCustom] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-400 uppercase tracking-widest">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {SHARPIE_COLORS.map(c => (
          <button
            key={c.name}
            title={c.name}
            onClick={() => { setCustom(false); onChange(c.hex, c.name); }}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{
              background: c.hex === 'none' ? 'transparent' : c.hex,
              borderColor: value === c.hex ? '#f59e0b' : '#444',
              boxShadow: value === c.hex ? '0 0 0 1px #f59e0b' : 'none',
            }}
          >
            {c.hex === 'none' && <span className="text-slate-500 text-[8px] font-bold">—</span>}
          </button>
        ))}
        <button
          onClick={() => setCustom(v => !v)}
          className={`w-6 h-6 rounded-full border-2 text-[8px] font-bold flex items-center justify-center transition-all ${custom ? 'border-amber-500 text-amber-400' : 'border-slate-600 text-slate-500'}`}
          style={{ background: 'linear-gradient(135deg,#e02020,#1a5fd4,#1a8a2e)' }}
          title="Custom color"
        />
      </div>
      {custom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value === 'none' ? '#ffffff' : value}
            onChange={e => onChange(e.target.value, 'Custom')}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <span className="text-xs text-slate-500 font-mono">{value}</span>
        </div>
      )}
      <p className="text-xs text-slate-600">{valueName}</p>
    </div>
  );
}

// ── Firing Family Generator ───────────────────────────────────────────────

const BODY_COLORS  = SHARPIE_COLORS.filter(c => c.hex !== 'none');
const GROOVE_COLORS = SHARPIE_COLORS.filter(c => c.hex !== 'none');

interface FiringStep {
  firing: number;
  bodyColor: string;
  bodyColorName: string;
  grooveColor: string;
  grooveColorName: string;
}

function generateFiringFamily(scheme: BrassScheme): FiringStep[] {
  const gStart = Math.max(0, GROOVE_COLORS.findIndex(c => c.hex === scheme.grooveColor));
  const bStart = Math.max(0, BODY_COLORS.findIndex(c => c.hex === scheme.bodyColor));
  return Array.from({ length: scheme.maxFirings }, (_, i) => {
    const bodyIdx   = (bStart + i) % BODY_COLORS.length;
    const grooveIdx = (gStart + Math.floor((bStart + i) / BODY_COLORS.length)) % GROOVE_COLORS.length;
    return {
      firing: i + 1,
      bodyColor:      BODY_COLORS[bodyIdx].hex,
      bodyColorName:  BODY_COLORS[bodyIdx].name,
      grooveColor:    GROOVE_COLORS[grooveIdx].hex,
      grooveColorName: GROOVE_COLORS[grooveIdx].name,
    };
  });
}

// ── Main Component ────────────────────────────────────────────────────────

export function BrassLabeler() {
  const [schemes, setSchemes] = useState<BrassScheme[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [caliber, setCaliber] = useState('6.5 Creedmoor');
  const [bodyColor, setBodyColor] = useState('none');
  const [bodyColorName, setBodyColorName] = useState('None');
  const [grooveColor, setGrooveColor] = useState('none');
  const [grooveColorName, setGrooveColorName] = useState('None');
  const [headColor, setHeadColor] = useState('none');
  const [headColorName, setHeadColorName] = useState('None');
  const [headShape, setHeadShape] = useState<MarkShape>('none');
  const [maxFirings, setMaxFirings] = useState(5);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setCaliber('6.5 Creedmoor');
    setBodyColor('none'); setBodyColorName('None');
    setGrooveColor('none'); setGrooveColorName('None');
    setHeadColor('none'); setHeadColorName('None');
    setHeadShape('none'); setMaxFirings(5); setNotes('');
    setIsAdding(false); setEditingId(null);
  };

  const handleSave = () => {
    const scheme: BrassScheme = {
      id: editingId || generateId(),
      name: name.trim() || 'Unnamed Scheme',
      caliber, bodyColor, bodyColorName, grooveColor, grooveColorName, headColor, headColorName, headShape,
      maxFirings, notes,
      createdAt: editingId ? (schemes.find(s => s.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    if (editingId) {
      setSchemes(prev => prev.map(s => s.id === editingId ? scheme : s));
    } else {
      setSchemes(prev => [...prev, scheme]);
    }
    resetForm();
  };

  const startEdit = (s: BrassScheme) => {
    setEditingId(s.id); setName(s.name); setCaliber(s.caliber);
    setBodyColor(s.bodyColor); setBodyColorName(s.bodyColorName);
    setGrooveColor(s.grooveColor || 'none'); setGrooveColorName(s.grooveColorName || 'None');
    setHeadColor(s.headColor); setHeadColorName(s.headColorName);
    setHeadShape(s.headShape); setMaxFirings(s.maxFirings); setNotes(s.notes);
    setIsAdding(true); setExpandedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Brass Labeler</h2>
          <p className="text-slate-400 text-sm mt-1">Track marking schemes for your brass</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />New Scheme
          </button>
        )}
      </div>

      {/* ── Instructions ── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-sm text-slate-400 space-y-2 leading-relaxed">
        <p className="text-slate-300 font-semibold text-lg">How to use</p>
        <p>Create a <span className="text-slate-200">labeling scheme</span> for each shooter or brass lot. Choose a <span className="text-slate-200">body stripe color</span> and <span className="text-slate-200">extractor groove color</span> as your firing-1 anchor — the system will automatically derive the full color sequence for subsequent firings, cycling through body colors first before advancing the groove color.</p>
        <p>The <span className="text-slate-200">case head mark</span> identifies the shooter and stays fixed across all firings. Apply marks with a paint pen or Sharpie — body stripe near the middle of the case, groove color in the extractor groove, head mark on the primer face.</p>
        <p className="text-slate-600">Tip: keep groove colors distinct between shooters sharing the same range session so cases sort instantly after a stage.</p>
      </div>

      {/* ── Add / Edit Form ── */}
      {isAdding && (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">{editingId ? 'Edit Scheme' : 'New Labeling Scheme'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-slate-400 uppercase tracking-widest">Scheme Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Match brass — shooter A"
                  className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-widest">Caliber</Label>
                <Input value={caliber} onChange={e => setCaliber(e.target.value)}
                  placeholder="e.g. 6.5 Creedmoor"
                  className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
            </div>

            {/* Marking config + live preview */}
            <div className="flex gap-6">
              {/* Left: all color pickers stacked */}
              <div className="flex-1 space-y-5">
                <ColorPicker
                  label="Body stripe color"
                  value={bodyColor}
                  valueName={bodyColorName}
                  onChange={(hex, nm) => { setBodyColor(hex); setBodyColorName(nm); }}
                />
                <ColorPicker
                  label="Extractor groove color"
                  value={grooveColor}
                  valueName={grooveColorName}
                  onChange={(hex, nm) => { setGrooveColor(hex); setGrooveColorName(nm); }}
                />
                <ColorPicker
                  label="Case head color"
                  value={headColor}
                  valueName={headColorName}
                  onChange={(hex, nm) => { setHeadColor(hex); setHeadColorName(nm); }}
                />
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 uppercase tracking-widest">Head mark shape</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {HEAD_SHAPES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setHeadShape(s.value)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${headShape === s.value ? 'border-amber-500 text-amber-400 bg-amber-900/20' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: live preview as vertical column */}
              <div className="flex-shrink-0 w-28">
                <Label className="text-xs text-slate-400 uppercase tracking-widest block mb-2">Preview</Label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col items-center gap-2">
                  <div className="text-center">
                    <CaseSideView bodyColor={bodyColor} bodyColorName={bodyColorName} grooveColor={grooveColor} grooveColorName={grooveColorName} />
                    <p className="text-[11px] text-slate-600 mt-1">Side Profile</p>
                  </div>
                  <div className="text-center">
                    <CaseHeadView headColor={headColor} headColorName={headColorName} headShape={headShape} />
                    <p className="text-[11px] text-slate-600 mt-1">Case head</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-widest">Max firings before retirement</Label>
                <Input type="number" value={maxFirings} onChange={e => setMaxFirings(parseInt(e.target.value) || 5)}
                  min={1} max={20}
                  className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-widest">Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white h-9" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" />{editingId ? 'Update' : 'Save Scheme'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-slate-600 text-slate-400 hover:bg-slate-800">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Schemes List ── */}
      {schemes.length === 0 && !isAdding ? (
        <div
          onClick={() => setIsAdding(true)}
          className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:border-amber-700 hover:bg-slate-900/30 transition-colors"
        >
          <Target className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-400 text-sm font-medium">No labeling schemes yet</p>
          <p className="text-slate-600 text-xs mt-1">Click to create your first scheme</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schemes.map(s => {
            const isExpanded = expandedId === s.id;
            const family = generateFiringFamily(s);
            return (
              <div key={s.id} className="w-full">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-left transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex gap-1 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full border border-slate-700"
                        style={{ background: s.bodyColor === 'none' ? '#1e1e1e' : s.bodyColor }}
                        title={`Body: ${s.bodyColorName}`} />
                      <div className="w-5 h-5 rounded-full border border-slate-700"
                        style={{ background: (s.grooveColor || 'none') === 'none' ? '#1e1e1e' : s.grooveColor }}
                        title={`Groove: ${s.grooveColorName}`} />
                      <div className="w-5 h-5 rounded-full border border-slate-700"
                        style={{ background: s.headColor === 'none' ? '#1e1e1e' : s.headColor }}
                        title={`Head: ${s.headColorName}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-white text-sm font-medium truncate block">{s.name}</span>
                      <p className="text-xs text-slate-500">{s.caliber} · {s.maxFirings} firings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); startEdit(s); }}
                      className="text-slate-500 hover:text-white p-1.5 rounded hover:bg-slate-700 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3M2 14l1.5-4.5L12.5 1 15 3.5 5.5 13.5 1 14z" /></svg>
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSchemes(prev => prev.filter(x => x.id !== s.id)); }}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-px p-4 bg-slate-900 border border-slate-800 border-t-0 rounded-b-md space-y-5">

                    {/* Head mark + legend */}
                    <div className="flex gap-6 items-start justify-center bg-slate-950 rounded-lg p-4 border border-slate-800">
                      <div className="text-center">
                        <CaseHeadView headColor={s.headColor} headColorName={s.headColorName} headShape={s.headShape} />
                        <p className="text-[12px] text-slate-600 mt-1">Case head</p>
                      </div>
                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-slate-700" style={{ background: s.headColor === 'none' ? '#1e1e1e' : s.headColor }} />
                          <span className="text-slate-400">Head: {s.headColorName}</span>
                        </div>
                        <div className="text-slate-500">Shape: {HEAD_SHAPES.find(h => h.value === s.headShape)?.label || 'None'}</div>
                        <div className="text-slate-500">Max firings: {s.maxFirings}</div>
                        {s.notes && <div className="text-slate-500 italic">{s.notes}</div>}
                      </div>
                    </div>

                    {/* Firing family */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Firing sequence</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {family.map(step => (
                          <div key={step.firing} className="flex-shrink-0 flex flex-col items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <p className="text-[11px] font-mono text-slate-500">{step.firing}×</p>
                            <CaseSideView
                              bodyColor={step.bodyColor}
                              bodyColorName={step.bodyColorName}
                              grooveColor={step.grooveColor}
                              grooveColorName={step.grooveColorName}
                            />
                            <div className="flex gap-1 mt-1">
                              <div className="w-3 h-3 rounded-full border border-slate-700"
                                style={{ background: step.bodyColor }} title={`Body: ${step.bodyColorName}`} />
                              <div className="w-3 h-3 rounded-full border border-slate-700"
                                style={{ background: step.grooveColor }} title={`Groove: ${step.grooveColorName}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
