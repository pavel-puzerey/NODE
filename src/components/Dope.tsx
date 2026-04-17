import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Minus, Printer, Crosshair } from 'lucide-react';
import { Rifle } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Unit = 'MOA' | 'MIL';

interface DopeRow {
  distance: number;
  elevation: string;
  windage: [string, string, string, string];
}

interface DopeCard {
  id: string;
  rifleId: string;
  unit: Unit;
  windSpeeds: [number, number, number, number];
  rows: DopeRow[];
}

interface DopeProps {
  rifles: Rifle[];
}

const BASE_DISTANCES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const DEFAULT_WIND_SPEEDS: [number, number, number, number] = [5, 10, 15, 20];

function makeDefaultRows(distances: number[]): DopeRow[] {
  return distances.map(d => ({
    distance: d,
    elevation: '',
    windage: ['', '', '', ''],
  }));
}

// Migrate cards saved under the old schema (notes field, no windage/windSpeeds)
function migrateCards(raw: any[]): DopeCard[] {
  return raw.map(c => ({
    ...c,
    windSpeeds: Array.isArray(c.windSpeeds) && c.windSpeeds.length === 4
      ? c.windSpeeds
      : DEFAULT_WIND_SPEEDS,
    rows: (c.rows ?? []).map((r: any) => ({
      distance: r.distance,
      elevation: r.elevation ?? '',
      windage: Array.isArray(r.windage) && r.windage.length === 4
        ? r.windage
        : ['', '', '', ''],
    })),
  }));
}

export function Dope({ rifles }: DopeProps) {
  const [rawCards, setCards] = useLocalStorage<any[]>('node-dope-cards', []);
  const cards: DopeCard[] = migrateCards(rawCards);
  const [selectedRifleId, setSelectedRifleId] = useState<string>('');

  const selectedCard = cards.find(c => c.rifleId === selectedRifleId) ?? null;

  const getOrCreateCard = (rifleId: string): DopeCard => {
    const existing = cards.find(c => c.rifleId === rifleId);
    if (existing) return existing;
    const newCard: DopeCard = {
      id: rifleId,
      rifleId,
      unit: 'MOA',
      windSpeeds: DEFAULT_WIND_SPEEDS,
      rows: makeDefaultRows(BASE_DISTANCES),
    };
    setCards([...cards, newCard]);
    return newCard;
  };

  const updateCard = (updated: DopeCard) => {
    setCards(cards.map(c => c.rifleId === updated.rifleId ? updated : c));
  };

  const handleRifleSelect = (rifleId: string) => {
    setSelectedRifleId(rifleId);
    getOrCreateCard(rifleId);
  };

  const handleUnitChange = (unit: Unit) => {
    if (!selectedCard) return;
    updateCard({ ...selectedCard, unit });
  };

  const handleElevationChange = (distance: number, value: string) => {
    if (!selectedCard) return;
    updateCard({
      ...selectedCard,
      rows: selectedCard.rows.map(r =>
        r.distance === distance ? { ...r, elevation: value } : r
      ),
    });
  };

  const handleWindageChange = (distance: number, idx: number, value: string) => {
    if (!selectedCard) return;
    updateCard({
      ...selectedCard,
      rows: selectedCard.rows.map(r => {
        if (r.distance !== distance) return r;
        const newWindage = [...r.windage] as [string, string, string, string];
        newWindage[idx] = value;
        return { ...r, windage: newWindage };
      }),
    });
  };

  const handleWindSpeedChange = (idx: number, value: string) => {
    if (!selectedCard) return;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 99) return;
    const newSpeeds = [...selectedCard.windSpeeds] as [number, number, number, number];
    newSpeeds[idx] = parsed;
    updateCard({ ...selectedCard, windSpeeds: newSpeeds });
  };

  const addDistance = () => {
    if (!selectedCard) return;
    const lastDist = selectedCard.rows[selectedCard.rows.length - 1]?.distance ?? 1000;
    const nextDist = lastDist + 100;
    if (nextDist > 3000) return;
    updateCard({
      ...selectedCard,
      rows: [...selectedCard.rows, { distance: nextDist, elevation: '', windage: ['', '', '', ''] }],
    });
  };

  const removeLastDistance = () => {
    if (!selectedCard || selectedCard.rows.length <= BASE_DISTANCES.length) return;
    updateCard({ ...selectedCard, rows: selectedCard.rows.slice(0, -1) });
  };

  const clearCard = () => {
    if (!selectedCard) return;
    if (confirm('Clear all DOPE data for this rifle?')) {
      updateCard({
        ...selectedCard,
        rows: makeDefaultRows(selectedCard.rows.map(r => r.distance)),
      });
    }
  };

  const handlePrint = () => {
    if (!selectedCard || !selectedRifle) return;

    const { unit, windSpeeds, rows } = selectedCard;

    const tableRows = rows.map(r => `
      <tr>
        <td>${r.distance}</td>
        <td>${r.elevation || '—'}</td>
        ${r.windage.map(w => `<td>${w || '—'}</td>`).join('')}
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>DOPE Card — ${selectedRifle.caliber}</title>
<style>
  @page {
    size: 5in 3in;
    margin: 0.15in;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 5in;
    height: 3in;
    font-family: 'Arial Narrow', Arial, sans-serif;
    font-size: 7.5pt;
    background: #fff;
    color: #000;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1.5px solid #000;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .header .title {
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .header .meta {
    font-size: 7pt;
    color: #333;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead tr {
    background: #222;
    color: #fff;
  }
  thead th {
    font-size: 6.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 3px;
    text-align: center;
    border: 0.5px solid #555;
  }
  thead th.left { text-align: left; }
  tbody tr:nth-child(even) { background: #f0f0f0; }
  tbody tr:nth-child(odd)  { background: #fff; }
  tbody td {
    font-size: 7.5pt;
    font-family: 'Courier New', monospace;
    padding: 1.5px 3px;
    text-align: center;
    border: 0.5px solid #ccc;
  }
  tbody td:first-child {
    font-weight: bold;
    text-align: left;
    border-left: none;
    letter-spacing: 0.02em;
  }
  .footer {
    margin-top: 3px;
    font-size: 6pt;
    color: #666;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
<div class="header">
  <span class="title">DOPE — ${selectedRifle.caliber} / ${selectedRifle.action}</span>
  <span class="meta">Unit: ${unit} &nbsp;|&nbsp; Wind: Full Value</span>
</div>
<table>
  <thead>
    <tr>
      <th class="left">DIST (yd)</th>
      <th>ELEV (${unit})</th>
      ${windSpeeds.map(s => `<th>W ${s}mph</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>
<div class="footer">
  <span>Printed ${new Date().toLocaleDateString()}</span>
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=600,height=400');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const maxDistance = selectedCard?.rows[selectedCard.rows.length - 1]?.distance ?? 1000;
  const selectedRifle = rifles.find(r => r.id === selectedRifleId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">DOPE</h2>

      {/* Rifle selector */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="space-y-2 w-full sm:flex-1 sm:max-w-sm">
          <Label className="text-slate-400 text-xs uppercase tracking-widest">Select Rifle</Label>
          <Select value={selectedRifleId} onValueChange={handleRifleSelect}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Choose a rifle…" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {rifles.length === 0 ? (
                <SelectItem value="_none" disabled className="text-slate-500">No rifles in inventory</SelectItem>
              ) : (
                rifles.map(r => (
                  <SelectItem key={r.id} value={r.id} className="text-white">
                    {r.caliber} — {r.action}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedCard && (
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs uppercase tracking-widest">Unit</Label>
            <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-md p-1">
              {(['MOA', 'MIL'] as Unit[]).map(u => (
                <button
                  key={u}
                  onClick={() => handleUnitChange(u)}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                    selectedCard.unit === u ? 'text-slate-900' : 'text-slate-500 hover:text-white'
                  }`}
                  style={selectedCard.unit === u ? { backgroundColor: '#f59e0b' } : {}}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No rifle selected */}
      {!selectedRifleId && (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-lg">
          <Crosshair className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">Select a rifle above to view or enter DOPE</p>
        </div>
      )}

      {/* DOPE table */}
      {selectedCard && selectedRifle && (
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white tracking-wide">
              {selectedRifle.caliber} — {selectedRifle.action}
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print 3×5
              </button>
              <button
                onClick={clearCard}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 px-3 py-1.5 rounded-md transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Column headers — wind speed inputs live inline above their columns */}
          <div className="grid grid-cols-12 gap-1 px-2 pb-1 border-b border-slate-800 items-end">
            {/* Dist header */}
            <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-widest pb-1">Distance</div>
            {/* Elev header */}
            <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-widest pb-1">Elevation</div>
            {/* Wind columns — editable speed input + mph label stacked above column */}
            {selectedCard.windSpeeds.map((speed, idx) => (
              <div key={idx} className="col-span-2 flex flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={speed}
                  onChange={e => handleWindSpeedChange(idx, e.target.value)}
                  className="w-14 h-7 text-center text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded text-amber-400 focus:outline-none focus:border-amber-600"
                />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">mph</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {selectedCard.rows.map((row) => (
              <div
                key={row.distance}
                className="grid grid-cols-12 gap-1 items-center px-2 py-1 rounded-md hover:bg-slate-900 transition-colors"
              >
                {/* Distance */}
                <div className="col-span-2 flex items-center gap-1">
                  <span
                    className="text-xs font-bold font-mono px-1.5 py-0.5 rounded border w-full text-center"
                    style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}
                  >
                    {row.distance}
                  </span>
                </div>

                {/* Elevation */}
                <div className="col-span-2">
                  <Input
                    value={row.elevation}
                    onChange={e => handleElevationChange(row.distance, e.target.value)}
                    placeholder="—"
                    className="h-8 text-sm font-mono bg-slate-950 border-slate-800 text-white focus:border-amber-600 placeholder:text-slate-700 text-center px-1"
                  />
                </div>

                {/* Windage x4 */}
                {([0, 1, 2, 3] as const).map(idx => (
                  <div key={idx} className="col-span-2">
                    <Input
                      value={row.windage[idx]}
                      onChange={e => handleWindageChange(row.distance, idx, e.target.value)}
                      placeholder="—"
                      className="h-8 text-sm font-mono bg-slate-950 border-slate-800 text-sky-300 focus:border-sky-600 placeholder:text-slate-700 text-center px-1"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Add / remove distance buttons */}
          <div className="flex items-center gap-3 pt-2 px-2">
            <button
              onClick={addDistance}
              disabled={maxDistance >= 3000}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {maxDistance < 3000 ? `+ Add ${maxDistance + 100} yd` : 'Max 3000 yd'}
            </button>
            {selectedCard.rows.length > BASE_DISTANCES.length && (
              <button
                onClick={removeLastDistance}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-900/50 bg-slate-900 hover:bg-red-950/20 px-3 py-1.5 rounded-md transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
                Remove {maxDistance} yd
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
