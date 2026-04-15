import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { Rifle, GearItem } from '../types';

interface LadderRow {
  charge: number;
  groupSize: string;
  velocity: string;
  roundCount: string;
  notes: string;
}

interface LadderTest {
  id: string;
  rifleId: string;
  bullet: string;
  powder: string;
  startCharge: number;
  endCharge: number;
  increment: number;
  distance: string;
  date: string;
  rows: LadderRow[];
}

interface LadderTestProps {
  rifles: Rifle[];
  gear?: GearItem[];
}

function generateRows(start: number, end: number, increment: number): LadderRow[] {
  const rows: LadderRow[] = [];
  let charge = start;
  while (charge <= end + 0.001) {
    rows.push({ charge: Math.round(charge * 10) / 10, groupSize: '', velocity: '', roundCount: '', notes: '' });
    charge += increment;
  }
  return rows;
}

export function LadderTest({ rifles, gear = [] }: LadderTestProps) {
  const [tests, setTests] = useState<LadderTest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formRifleId, setFormRifleId] = useState('');
  const [formBullet, setFormBullet] = useState('');
  const [formPowder, setFormPowder] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formIncrement, setFormIncrement] = useState('0.5');
  const [formDistance, setFormDistance] = useState('100');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const bullets = gear.filter(g => g.gearType === 'Bullet');
  const powders = gear.filter(g => g.gearType === 'Powder');
  const cases = gear.filter(g => g.gearType === 'Case');
  const primers = gear.filter(g => g.gearType === 'Primer');

  const handleCreate = () => {
    const start = parseFloat(formStart);
    const end = parseFloat(formEnd);
    const increment = parseFloat(formIncrement);
    if (!formRifleId || !formBullet || !formPowder || isNaN(start) || isNaN(end) || isNaN(increment) || start >= end) return;

    const newTest: LadderTest = {
      id: Date.now().toString(),
      rifleId: formRifleId,
      bullet: formBullet,
      powder: formPowder,
      startCharge: start,
      endCharge: end,
      increment,
      distance: formDistance,
      date: formDate,
      rows: generateRows(start, end, increment),
    };
    setTests([newTest, ...tests]);
    setExpandedId(newTest.id);
    setIsCreating(false);
    setFormRifleId(''); setFormBullet(''); setFormPowder('');
    setFormStart(''); setFormEnd(''); setFormIncrement('0.5');
    setFormDistance('100');
    setFormDate(new Date().toISOString().split('T')[0]);
  };

  const updateRow = (testId: string, charge: number, field: keyof LadderRow, value: string) => {
    setTests(tests.map(t => t.id !== testId ? t : {
      ...t,
      rows: t.rows.map(r => r.charge === charge ? { ...r, [field]: value } : r),
    }));
  };

  const deleteTest = (id: string) => {
    if (!confirm('Delete this ladder test?')) return;
    setTests(tests.filter(t => t.id !== id));
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m)-1]} ${day}, ${y}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Ladder Test</h2>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" />New Ladder Test
          </Button>
        )}
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-4">
          <h3 className="text-sm font-semibold text-white">New Ladder Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Rifle</Label>
              <Select value={formRifleId} onValueChange={setFormRifleId}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Select rifle…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {rifles.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-white">{r.caliber} — {r.action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Date</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Bullet</Label>
              {bullets.length > 0 ? (
                <Select value={formBullet} onValueChange={setFormBullet}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9">
                    <SelectValue placeholder="Select bullet…" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {bullets.map(b => (
                      <SelectItem key={b.id} value={`${b.brand} ${b.model}${b.weight ? ` ${b.weight}gr` : ''}`} className="text-white">
                        {b.brand} {b.model}{b.weight ? ` ${b.weight}gr` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="_manual" className="text-slate-400">Enter manually…</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(bullets.length === 0 || formBullet === '_manual') && (
                <Input value={formBullet === '_manual' ? '' : formBullet} onChange={e => setFormBullet(e.target.value)} placeholder="e.g. Berger 140gr Hybrid" className="bg-slate-950 border-slate-700 text-white h-9 mt-1" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Powder</Label>
              {powders.length > 0 ? (
                <Select value={formPowder} onValueChange={setFormPowder}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-9">
                    <SelectValue placeholder="Select powder…" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {powders.map(p => (
                      <SelectItem key={p.id} value={`${p.brand} ${p.model}`} className="text-white">
                        {p.brand} {p.model}
                      </SelectItem>
                    ))}
                    <SelectItem value="_manual" className="text-slate-400">Enter manually…</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(powders.length === 0 || formPowder === '_manual') && (
                <Input value={formPowder === '_manual' ? '' : formPowder} onChange={e => setFormPowder(e.target.value)} placeholder="e.g. H4350" className="bg-slate-950 border-slate-700 text-white h-9 mt-1" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Start Charge (gr)</Label>
              <Input type="number" step="0.1" value={formStart} onChange={e => setFormStart(e.target.value)} placeholder="e.g. 40.0" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">End Charge (gr)</Label>
              <Input type="number" step="0.1" value={formEnd} onChange={e => setFormEnd(e.target.value)} placeholder="e.g. 43.0" className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Increment (gr)</Label>
              <Input type="number" step="0.1" value={formIncrement} onChange={e => setFormIncrement(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Distance (yards)</Label>
              <Input type="number" value={formDistance} onChange={e => setFormDistance(e.target.value)} className="bg-slate-950 border-slate-700 text-white h-9" />
            </div>
          </div>
          {formStart && formEnd && formIncrement && (
            <p className="text-xs text-slate-500">
              {generateRows(parseFloat(formStart), parseFloat(formEnd), parseFloat(formIncrement)).length} charge weights will be generated
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700 text-white">Generate Test Plan</Button>
            <Button onClick={() => setIsCreating(false)} variant="outline" className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
          </div>
        </div>
      )}

      {/* Tests list */}
      {tests.length === 0 && !isCreating && (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">No ladder tests yet</p>
        </div>
      )}

      <div className="space-y-2">
        {tests.map(test => {
          const rifle = rifles.find(r => r.id === test.rifleId);
          const isExpanded = expandedId === test.id;
          const filled = test.rows.filter(r => r.groupSize || r.velocity).length;
          return (
            <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors text-left"
                onClick={() => setExpandedId(isExpanded ? null : test.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded border" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
                    {test.startCharge}–{test.endCharge}gr
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white">{test.bullet} · {test.powder}</div>
                    <div className="text-xs text-slate-500">{rifle ? `${rifle.caliber} — ${rifle.action}` : '—'} · {test.distance}yd · {formatDate(test.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600">{filled}/{test.rows.length} filled</span>
                  <button onClick={e => { e.stopPropagation(); deleteTest(test.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4">
                  {/* Column headers */}
                  <div className="grid grid-cols-13 gap-2 mb-2 px-1" style={{gridTemplateColumns:'repeat(13,minmax(0,1fr))'}}>
                    <div className="col-span-2 text-xs text-slate-600 uppercase tracking-widest">Charge (gr)</div>
                    <div className="col-span-2 text-xs text-slate-600 uppercase tracking-widest">Rounds</div>
                    <div className="col-span-3 text-xs text-slate-600 uppercase tracking-widest">Group Size (in)</div>
                    <div className="col-span-3 text-xs text-slate-600 uppercase tracking-widest">Velocity (fps)</div>
                    <div className="col-span-3 text-xs text-slate-600 uppercase tracking-widest">Notes</div>
                  </div>
                  <div className="space-y-1">
                    {test.rows.map(row => (
                      <div key={row.charge} className="grid gap-2 items-center hover:bg-slate-800 rounded px-1 py-0.5" style={{gridTemplateColumns:'repeat(13,minmax(0,1fr))'}}>
                        <div className="col-span-2">
                          <span className="text-xs font-mono font-bold" style={{ color: '#f59e0b' }}>{row.charge}</span>
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={row.roundCount}
                            onChange={e => updateRow(test.id, row.charge, 'roundCount', e.target.value)}
                            placeholder="5"
                            className="h-7 text-xs font-mono bg-slate-950 border-slate-800 text-white focus:border-amber-600 placeholder:text-slate-700"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={row.groupSize}
                            onChange={e => updateRow(test.id, row.charge, 'groupSize', e.target.value)}
                            placeholder="0.450"
                            className="h-7 text-xs font-mono bg-slate-950 border-slate-800 text-white focus:border-amber-600 placeholder:text-slate-700"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={row.velocity}
                            onChange={e => updateRow(test.id, row.charge, 'velocity', e.target.value)}
                            placeholder="2750"
                            className="h-7 text-xs font-mono bg-slate-950 border-slate-800 text-white focus:border-amber-600 placeholder:text-slate-700"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={row.notes}
                            onChange={e => updateRow(test.id, row.charge, 'notes', e.target.value)}
                            placeholder="pressure signs, etc."
                            className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-400 focus:border-slate-600 placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
