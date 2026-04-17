import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Crosshair, RotateCcw, Ruler, CheckCircle, Info } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Point {
  x: number;
  y: number;
}

export interface GroupAnalysis {
  shotCount: number;
  groupSize: number;
  groupSizeMoa: number | null;
  meanRadius: number;
  meanRadiusMoa: number | null;
  width: number;
  height: number;
  distance: string;
}

interface TargetAnalyzerProps {
  imageData: string;
  groupId: string;
  distance?: string;
  onSave: (analysis: GroupAnalysis, annotatedImage: string) => void;
  onClose: () => void;
}

type Step = 'scale1' | 'scale2' | 'shots' | 'results';

export function TargetAnalyzer({ imageData, groupId, distance = '', onSave, onClose }: TargetAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [step, setStep] = useState<Step>('scale1');
  const [scalePt1, setScalePt1] = useState<Point | null>(null);
  const [scalePt2, setScalePt2] = useState<Point | null>(null);
  const [scaleRealDist, setScaleRealDist] = useState('1');
  const [shots, setShots] = useState<Point[]>([]);
  const [sessionDistance, setSessionDistance] = useState(distance);
  const [analysis, setAnalysis] = useState<GroupAnalysis | null>(null);
  const [overlayPos, setOverlayPos] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const maxW = Math.min(window.innerWidth - 320, window.innerWidth - 48);
    const maxH = window.innerHeight * 0.88;
    const ratio = img.naturalWidth / img.naturalHeight;
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    setCanvasSize({ w: Math.round(w), h: Math.round(h) });
  }, [imgLoaded]);

  // Compute pixels per inch from scale points
  const calcPpu = useCallback((cw: number, ch: number): number | null => {
    if (!scalePt1 || !scalePt2 || !cw) return null;
    const dx = (scalePt2.x - scalePt1.x) * cw;
    const dy = (scalePt2.y - scalePt1.y) * ch;
    const pxDist = Math.sqrt(dx * dx + dy * dy);
    const realDist = parseFloat(scaleRealDist);
    if (!realDist || pxDist === 0) return null;
    return pxDist / realDist;
  }, [scalePt1, scalePt2, scaleRealDist]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded || canvasSize.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    const toC = (p: Point) => ({ x: p.x * W, y: p.y * H });

    // Scale points
    [scalePt1, scalePt2].forEach((pt, i) => {
      if (!pt) return;
      const cp = toC(pt);
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee'; ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(`S${i + 1}`, cp.x + 8, cp.y - 3);
    });
    if (scalePt1 && scalePt2) {
      const c1 = toC(scalePt1), c2 = toC(scalePt2);
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y);
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Shot holes — 0.25" diameter if scale known, else fixed 10px
    const ppu = calcPpu(W, H);
    const markerR = ppu ? Math.max(6, ppu * 0.125) : 10;
    shots.forEach((pt, i) => {
      const cp = toC(pt);
      ctx.beginPath(); ctx.arc(cp.x, cp.y, markerR, 0, Math.PI * 2);
      ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#39ff14';
      const fs = Math.max(8, Math.min(markerR * 0.9, 14));
      ctx.font = `700 ${fs}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cp.x, cp.y);
    });

    // Centroid + lines when results shown
    if (analysis && shots.length >= 2) {
      const cx = shots.reduce((s, p) => s + p.x, 0) / shots.length;
      const cy = shots.reduce((s, p) => s + p.y, 0) / shots.length;
      const cc = { x: cx * W, y: cy * H };
      shots.forEach(pt => {
        const cp = toC(pt);
        ctx.beginPath(); ctx.moveTo(cc.x, cc.y); ctx.lineTo(cp.x, cp.y);
        ctx.strokeStyle = 'rgba(57,255,20,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cc.x, cc.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }, [imgLoaded, canvasSize, scalePt1, scalePt2, shots, analysis, calcPpu]);

  useEffect(() => { draw(); }, [draw]);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragging(true);
    setDragOffset({ x: e.clientX - overlayPos.x, y: e.clientY - overlayPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOverlayPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseUp = () => { if (dragging) setDragging(false); };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || step === 'results') return;
    const rect = canvas.getBoundingClientRect();
    const pt: Point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    if (step === 'scale1') { setScalePt1(pt); setStep('scale2'); }
    else if (step === 'scale2') { setScalePt2(pt); setStep('shots'); }
    else if (step === 'shots') { setShots(prev => [...prev, pt]); }
  };

  const computeAnalysis = () => {
    const ppu = calcPpu(canvasSize.w, canvasSize.h);
    if (!ppu || shots.length < 2) return;

    const pts = shots.map(p => ({ x: p.x * canvasSize.w, y: p.y * canvasSize.h }));
    const dist = (a: Point, b: Point) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / ppu;

    let maxDist = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        maxDist = Math.max(maxDist, dist(pts[i], pts[j]));

    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const meanR = pts.reduce((s, p) => s + dist(p, { x: cx, y: cy }), 0) / pts.length;

    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const bw = (Math.max(...xs) - Math.min(...xs)) / ppu;
    const bh = (Math.max(...ys) - Math.min(...ys)) / ppu;

    const distYards = parseFloat(sessionDistance);
    const inchPerMoa = (!isNaN(distYards) && distYards > 0) ? (distYards / 100) * 1.0472 : null;
    const toMoa = (v: number): number | null => inchPerMoa ? Math.round(v / inchPerMoa * 100) / 100 : null;

    const r: GroupAnalysis = {
      shotCount: shots.length,
      groupSize: Math.round(maxDist * 1000) / 1000,
      groupSizeMoa: toMoa(maxDist),
      meanRadius: Math.round(meanR * 1000) / 1000,
      meanRadiusMoa: toMoa(meanR),
      width: Math.round(bw * 1000) / 1000,
      height: Math.round(bh * 1000) / 1000,
      distance: sessionDistance,
    };
    setAnalysis(r);
    setStep('results');
    setOverlayPos({ x: 16, y: 16 });
  };

  const drawOverlayOnCanvas = (ctx: CanvasRenderingContext2D, a: GroupAnalysis, x: number, y: number) => {
    const lines: string[] = [];
    if (a.distance) lines.push(`@ ${a.distance}`);
    lines.push(`Shots: ${a.shotCount}`);
    lines.push(`Group: ${a.groupSize}"${a.groupSizeMoa !== null ? `  ${a.groupSizeMoa} MOA` : ''}`);
    lines.push(`MR: ${a.meanRadius}"${a.meanRadiusMoa !== null ? `  ${a.meanRadiusMoa} MOA` : ''}`);

    const fontSize = 13;
    const lineH = fontSize * 1.6;
    const padX = 10, padY = 8;
    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxW = maxW + padX * 2;
    const boxH = lines.length * lineH + padY * 2;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#39ff14';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      const isBold = i === 0 && !!a.distance;
      ctx.font = `${isBold ? '700' : '600'} ${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillText(line, x + padX, y + padY + i * lineH);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  const handleSave = () => {
    if (!analysis) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      // overlayPos is relative to the container; subtract canvas offset within container
      const canvasX = rect.left - (canvas.parentElement?.getBoundingClientRect().left ?? rect.left);
      const canvasY = rect.top - (canvas.parentElement?.getBoundingClientRect().top ?? rect.top);
      const relX = Math.max(0, overlayPos.x - canvasX);
      const relY = Math.max(0, overlayPos.y - canvasY);
      drawOverlayOnCanvas(ctx, analysis, relX * scaleX, relY * scaleY);
    }
    onSave(analysis, canvas.toDataURL('image/jpeg', 0.92));
  };

  const stepLabel: Record<Step, string> = {
    scale1: '1 — Click first scale point',
    scale2: '2 — Click second scale point',
    shots: '3 — Click each shot hole',
    results: '4 — Review & save',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Crosshair className="w-5 h-5 text-amber-400" />
          <span className="text-white font-semibold text-sm">Target Analyzer</span>
          <span className="text-xs text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-900/50 bg-amber-900/10">
            {stepLabel[step]}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {imgLoaded && canvasSize.w > 0 ? (
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              onClick={handleCanvasClick}
              style={{ cursor: step === 'results' ? 'default' : 'crosshair', maxWidth: '100%', border: '1px solid #222', borderRadius: 8 }}
            />
          ) : (
            <div className="text-slate-500 text-sm">Loading image…</div>
          )}
          {/* Draggable results overlay */}
          {analysis && step === 'results' && (
            <div
              onMouseDown={handleOverlayMouseDown}
              style={{
                position: 'absolute',
                left: overlayPos.x,
                top: overlayPos.y,
                cursor: dragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: 20,
                backgroundColor: 'rgba(0,0,0,0.65)',
                border: '1px solid #39ff14',
                boxShadow: '0 0 10px rgba(57,255,20,0.25)',
                borderRadius: 6,
                padding: '8px 12px',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                color: '#39ff14',
                lineHeight: 1.65,
                minWidth: 160,
              }}
            >
              {analysis.distance && <div style={{ fontWeight: 700 }}>@ {analysis.distance}</div>}
              <div>Shots: <strong>{analysis.shotCount}</strong></div>
              <div>Group: <strong>{analysis.groupSize}"</strong>{analysis.groupSizeMoa !== null && <span style={{ opacity: 0.65, marginLeft: 6 }}>{analysis.groupSizeMoa} MOA</span>}</div>
              <div>MR: <strong>{analysis.meanRadius}"</strong>{analysis.meanRadiusMoa !== null && <span style={{ opacity: 0.65, marginLeft: 6 }}>{analysis.meanRadiusMoa} MOA</span>}</div>
              <div style={{ fontSize: 9, opacity: 0.4, marginTop: 3 }}>drag to move</div>
            </div>
          )}
        </div>

        <div className="w-72 flex-shrink-0 border-l border-slate-800 flex flex-col overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#0d0d0d' }}>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Distance</label>
            <input value={sessionDistance} onChange={e => setSessionDistance(e.target.value)} placeholder="e.g. 100 yds"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 uppercase tracking-widest">Scale Reference</span>
            </div>
            <p className="text-xs text-slate-500">Click two points with a known real-world distance (e.g. 1" grid lines).</p>
            <div className="flex gap-2 items-center">
              <input type="number" step="0.01" value={scaleRealDist} onChange={e => setScaleRealDist(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-600" />
              <span className="text-xs text-slate-500">in</span>
            </div>
            <div className="flex gap-3 text-xs">
              {['S1', 'S2'].map((label, i) => {
                const set = i === 0 ? !!scalePt1 : !!scalePt2;
                return <span key={label} className={`flex items-center gap-1 ${set ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${set ? 'bg-cyan-400' : 'bg-slate-700'}`} />{label}
                </span>;
              })}
              {scalePt1 && scalePt2 && (
                <button onClick={() => { setScalePt1(null); setScalePt2(null); setStep('scale1'); }} className="ml-auto text-slate-500 hover:text-red-400 transition-colors">Reset</button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">Shot Holes ({shots.length})</span>
              </div>
              {shots.length > 0 && step === 'shots' && (
                <button onClick={() => setShots(prev => prev.slice(0, -1))} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Undo
                </button>
              )}
            </div>
            {step === 'shots' && <p className="text-xs text-slate-500">Click each bullet hole.</p>}
            {shots.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {shots.map((_, i) => (
                  <span key={i} className="w-6 h-6 rounded-full bg-green-900/30 border border-green-700/50 text-green-400 text-xs flex items-center justify-center font-mono">{i + 1}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {step === 'shots' && shots.length >= 2 && (
              <Button onClick={computeAnalysis} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />Compute Results
              </Button>
            )}
            {step === 'shots' && shots.length < 2 && <p className="text-xs text-slate-600 text-center">Mark at least 2 shot holes</p>}
            {shots.length > 0 && step !== 'results' && (
              <button onClick={() => setShots([])} className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors py-1">Clear all shots</button>
            )}
          </div>

          {step === 'results' && analysis && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">Results</span>
                {sessionDistance && <span className="text-xs text-slate-500">@ {sessionDistance}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-slate-400">Shots</span><span className="text-sm font-mono text-amber-400 font-semibold">{analysis.shotCount}</span></div>
                {([
                  { label: 'Group Size', inch: analysis.groupSize, moa: analysis.groupSizeMoa },
                  { label: 'Mean Radius', inch: analysis.meanRadius, moa: analysis.meanRadiusMoa },
                  { label: 'Width', inch: analysis.width, moa: null },
                  { label: 'Height', inch: analysis.height, moa: null },
                ] as { label: string; inch: number; moa: number | null }[]).map(({ label, inch, moa }) => (
                  <div key={label} className="flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
                    <div className="flex items-center gap-2">
                      {moa !== null && <span className="text-xs font-mono text-slate-400">{moa} MOA</span>}
                      <span className="text-sm font-mono text-amber-400 font-semibold">{inch}"</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 p-2 bg-slate-900 rounded text-xs text-slate-500 border border-slate-800">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                Accuracy depends on scale reference precision.
              </div>
              <Button onClick={handleSave} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm">Save to Group</Button>
              <button onClick={() => { setAnalysis(null); setStep('shots'); }} className="w-full text-xs text-slate-500 hover:text-white transition-colors py-1">← Back to editing</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
