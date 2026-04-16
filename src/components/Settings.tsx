import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';
import { UserSettings, BackupData } from '../types';

interface SettingsProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
  setRifles: (rifles: any[]) => void;
  setLoads: (loads: any[]) => void;
  setGear: (gear: any[]) => void;
  setSessions: (sessions: any[]) => void;
  setMatches: (matches: any[]) => void;
  setAccessories: (accessories: any[]) => void;
  setGlass: (glass: any[]) => void;
}

export function Settings({ 
  settings, 
  setSettings,
  setRifles,
  setLoads,
  setGear,
  setSessions,
  setMatches,
  setAccessories,
  setGlass
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExport = () => {
    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      rifles: JSON.parse(localStorage.getItem('precision-rifles') || '[]'),
      loads: JSON.parse(localStorage.getItem('precision-loads') || '[]'),
      gear: JSON.parse(localStorage.getItem('precision-gear') || '[]'),
      sessions: JSON.parse(localStorage.getItem('precision-sessions') || '[]'),
      matches: JSON.parse(localStorage.getItem('precision-matches') || '[]'),
      accessories: JSON.parse(localStorage.getItem('precision-accessories') || '[]'),
      glass: JSON.parse(localStorage.getItem('precision-glass') || '[]'),
      settings: settings,
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `precision-logbook-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: BackupData = JSON.parse(content);

        // Basic validation
        if (!data.version || !data.timestamp) {
          throw new Error('Invalid backup file format');
        }

        // Restore data
        if (data.rifles) setRifles(data.rifles);
        if (data.loads) setLoads(data.loads);
        if (data.gear) setGear(data.gear);
        if (data.sessions) setSessions(data.sessions);
        if (data.matches) setMatches(data.matches);
        if (data.accessories) setAccessories(data.accessories);
        if (data.glass) setGlass(data.glass);
        if (data.settings) setSettings(data.settings);

        alert('Data imported successfully!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Error importing data: Invalid file format');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAll = () => {
    setRifles([]);
    setLoads([]);
    setGear([]);
    setSessions([]);
    setMatches([]);
    setAccessories([]);
    setGlass([]);
    const keys = ['precision-rifles','precision-loads','precision-gear','precision-sessions','precision-matches','precision-accessories','precision-glass'];
    keys.forEach(k => localStorage.removeItem(k));
    setDeleteStep(0);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">



      <Card className="bg-slate-900 border-slate-800 card-tactical">
        <CardHeader>
          <CardTitle className="text-white">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Export Data</h3>
                <p className="text-sm text-slate-400">Download all your data as a JSON file</p>
              </div>
            </div>
            <Button onClick={handleExport} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Backup
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Import Data</h3>
                <p className="text-sm text-slate-400">Restore data from a backup file</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Label htmlFor="import-file" className="cursor-pointer">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Backup
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-500">Warning</h3>
              <p className="text-sm text-slate-300 mt-1">
                Importing a backup file will <strong>overwrite all existing data</strong> in the browser. 
                Please ensure you have exported your current data before importing if you wish to keep it.
              </p>
            </div>
          </div>

          {/* Delete All Data */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/40">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400">Delete All Data</h3>
                  <p className="text-sm text-slate-400">Permanently erase all rifles, loads, sessions, and gear</p>
                </div>
              </div>
              {deleteStep === 0 && (
                <Button
                  onClick={() => setDeleteStep(1)}
                  variant="outline"
                  className="border-red-900/60 text-red-400 hover:bg-red-950/40 hover:text-red-300 hover:border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />Delete All
                </Button>
              )}
            </div>

            {/* Step 1: First confirmation */}
            {deleteStep === 1 && (
              <div className="mt-3 p-4 bg-red-950/20 border border-red-900/40 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-medium">This will permanently delete all your data — rifles, optics, loads, sessions, gear, and matches. This cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setDeleteStep(2)} className="bg-red-700 hover:bg-red-600 text-white text-sm">
                    Yes, I want to delete everything
                  </Button>
                  <Button onClick={() => setDeleteStep(0)} variant="outline" className="border-slate-700 text-slate-400 hover:text-white text-sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Second confirmation */}
            {deleteStep === 2 && (
              <div className="mt-3 p-4 bg-red-950/30 border border-red-800/60 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-medium">Are you absolutely sure? You will lose every session log, load recipe, and equipment record you have ever entered.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setDeleteStep(3)} className="bg-red-700 hover:bg-red-600 text-white text-sm">
                    I understand, continue
                  </Button>
                  <Button onClick={() => setDeleteStep(0)} variant="outline" className="border-slate-700 text-slate-400 hover:text-white text-sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Type to confirm */}
            {deleteStep === 3 && (
              <div className="mt-3 p-4 bg-red-950/40 border border-red-700/60 rounded-lg space-y-3">
                <p className="text-sm text-red-300 font-medium">Type <span className="font-mono bg-red-950/60 px-1.5 py-0.5 rounded text-red-200">DELETE</span> to confirm permanent deletion.</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full bg-slate-950 border border-red-900/60 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAll}
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="bg-red-700 hover:bg-red-600 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />Permanently Delete All Data
                  </Button>
                  <Button onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }} variant="outline" className="border-slate-700 text-slate-400 hover:text-white text-sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}