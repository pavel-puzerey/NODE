import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, Crosshair, Target, RotateCcw, Save, Trash2, Check } from 'lucide-react';
import { TargetAnalysis, Point } from '../types';
import { 
  calculateDistance, 
  calculateScale, 
  calculateGroupSize, 
  calculateExtremeSpread, 
  calculateMeanRadius,
  calculateCentroid 
} from '../utils/geometry';
import { generateId } from '../utils/id';

type Mode = 'idle' | 'calibrating' | 'marking';

interface TargetAnalysisToolProps {
  onSaveAnalysis: (analysis: TargetAnalysis) => void;
}

export function TargetAnalysisTool({ onSaveAnalysis }: TargetAnalysisToolProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [calibrationDistance, setCalibrationDistance] = useState<number>(1);
  const [impacts, setImpacts] = useState<Point[]>([]);
  const [scale, setScale] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        setImageDimensions({ width: img.width, height: img.height });
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [imageSrc, calibrationPoints, impacts]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageSrc) return;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = imageSrc;
    ctx.drawImage(img, 0, 0);

    // Draw calibration line
    if (calibrationPoints.length === 2) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
      ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
      ctx.stroke();
    }

    // Draw calibration points
    calibrationPoints.forEach((point, index) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index + 1, point.x, point.y);
    });

    // Draw impacts
    impacts.forEach((point, index) => {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw centroid if we have impacts
    if (impacts.length > 0) {
      const center = calculateCentroid(impacts);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.x - 10, center.y);
      ctx.lineTo(center.x + 10, center.y);
      ctx.moveTo(center.x, center.y - 10);
      ctx.lineTo(center.x, center.y + 10);
      ctx.stroke();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setCalibrationPoints([]);
        setImpacts([]);
        setScale(0);
        setMode('idle');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (mode === 'calibrating') {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, { x, y }]);
        if (calibrationPoints.length === 1) {
          // Need second point
        } else {
          // Calibration complete
          const dist = calculateDistance(calibrationPoints[0], { x, y });
          setScale(calculateScale(dist, calibrationDistance));
          setMode('idle');
        }
      }
    } else if (mode === 'marking') {
      setImpacts([...impacts, { x, y }]);
    }
  };

  const startCalibration = () => {
    setCalibrationPoints([]);
    setMode('calibrating');
  };

  const startMarking = () => {
    if (scale === 0) {
      alert('Please calibrate the target first');
      return;
    }
    setMode('marking');
  };

  const clearImpacts = () => {
    setImpacts([]);
  };

  const resetAll = () => {
    setImageSrc(null);
    setCalibrationPoints([]);
    setImpacts([]);
    setScale(0);
    setMode('idle');
  };

  const saveAnalysis = () => {
    if (!imageSrc || impacts.length === 0) {
      alert('Please upload an image and mark at least one impact');
      return;
    }

    const analysis: TargetAnalysis = {
      id: generateId(),
      imageUrl: imageSrc,
      calibrationPoints,
      calibrationDistance,
      impacts,
      calculatedStats: {
        groupSizeIn: parseFloat(calculateGroupSize(impacts, scale).toFixed(4)),
        extremeSpreadIn: parseFloat(calculateExtremeSpread(impacts, scale).toFixed(4)),
        meanRadiusIn: parseFloat(calculateMeanRadius(impacts, scale).toFixed(4)),
        center: calculateCentroid(impacts)
      },
      createdAt: new Date().toISOString()
    };

    onSaveAnalysis(analysis);
    resetAll();
  };

  const stats = impacts.length > 0 ? {
    groupSize: calculateGroupSize(impacts, scale).toFixed(4),
    extremeSpread: calculateExtremeSpread(impacts, scale).toFixed(4),
    meanRadius: calculateMeanRadius(impacts, scale).toFixed(4)
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6" />
          Target Analysis
        </h2>
      </div>

      {!imageSrc ? (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-slate-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Click to upload target image</p>
              <p className="text-slate-600 text-sm">Supports JPG, PNG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Target View</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetAll}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-slate-900 rounded-lg overflow-hidden cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full h-auto"
                  />
                  {mode === 'calibrating' && (
                    <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded text-sm font-medium">
                      Click first calibration point
                    </div>
                  )}
                  {mode === 'marking' && (
                    <div className="absolute top-4 left-4 bg-yellow-500/90 text-black px-3 py-1 rounded text-sm font-medium">
                      Click bullet holes to mark impacts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader>
                <CardTitle className="text-white">Controls</CardTitle>
                <CardDescription className="text-slate-400">
                  Calibrate and mark your target
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Calibration Distance (inches)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calibrationDistance}
                    onChange={(e) => setCalibrationDistance(parseFloat(e.target.value) || 1)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={calibrationPoints.length > 0}
                  />
                </div>

                <Button
                  onClick={startCalibration}
                  disabled={calibrationPoints.length >= 2}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Crosshair className="w-4 h-4 mr-2" />
                  {calibrationPoints.length === 0 ? 'Start Calibration' : 'Mark Second Point'}
                </Button>

                <Button
                  onClick={startMarking}
                  disabled={scale === 0}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Mark Impacts
                </Button>

                <Button
                  onClick={clearImpacts}
                  disabled={impacts.length === 0}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Impacts
                </Button>
              </CardContent>
            </Card>

            {stats && (
              <Card className="bg-slate-900 border-slate-800 card-tactical">
                <CardHeader>
                  <CardTitle className="text-white">Results</CardTitle>
                  <CardDescription className="text-slate-400">
                    {impacts.length} shots measured
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Group Size</span>
                    <span className="text-white font-mono font-bold">{stats.groupSize}"</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Extreme Spread</span>
                    <span className="text-white font-mono font-bold">{stats.extremeSpread}"</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Mean Radius</span>
                    <span className="text-white font-mono font-bold">{stats.meanRadius}"</span>
                  </div>
                  <Button
                    onClick={saveAnalysis}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}