import './fonts.css';
import { useState } from 'react';
import { RifleManager } from './components/RifleManager';
import { LoadDevelopment } from './components/LoadDevelopment';
import { RangeSessionLogger } from './components/RangeSession';
import { SessionHistory } from './components/SessionHistory';
import { ReloadingGear } from './components/ReloadingGear';
import { Accessories } from './components/Accessories';
import { GlassManager } from './components/GlassManager';
import { Settings } from './components/Settings';
import { MatchCalendar } from './components/MatchCalendar';
import { Dashboard } from './components/Dashboard';
import { LoadAnalysis } from './components/LoadAnalysis';
import { TargetAnalysisTool } from './components/TargetAnalysis';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  Rifle, Load, GearItem, RangeSession, UserSettings,
  Accessory, Glass, MatchEvent, TargetAnalysis
} from './types';
import {
  Target, Package, Calendar, Settings as SettingsIcon,
  Shield, Search, BarChart2, BarChart3, Menu, Check, Crosshair
} from 'lucide-react';
import { Button } from './components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [rifles, setRifles]           = useLocalStorage<Rifle[]>('precision-rifles', []);
  const [loads, setLoads]             = useLocalStorage<Load[]>('precision-loads', []);
  const [gear, setGear]               = useLocalStorage<GearItem[]>('precision-gear', []);
  const [accessories, setAccessories] = useLocalStorage<Accessory[]>('precision-accessories', []);
  const [glass, setGlass]             = useLocalStorage<Glass[]>('precision-glass', []);
  const [sessions, setSessions]       = useLocalStorage<RangeSession[]>('precision-sessions', []);
  const [matches, setMatches]         = useLocalStorage<MatchEvent[]>('precision-matches', []);
  const [targetAnalyses, setTargetAnalyses] = useLocalStorage<TargetAnalysis[]>('precision-target-analyses', []);
  const [settings, setSettings]       = useLocalStorage<UserSettings>('precision-settings', {
    theme: 'slate',
    userName: 'Shooter',
    userAvatar: null,
    userProfilePicture: null,
    email: '',
    password: '',
    shootingClass: '',
    memberships: [],
  });

  const handleSaveTargetAnalysis = (analysis: TargetAnalysis) => {
    setTargetAnalyses([analysis, ...targetAnalyses]);
  };

  const navGroups = [
    {
      label: 'Equipment',
      items: [
        { id: 'rifles',      label: 'Rifles',         icon: Target },
        { id: 'glass',       label: 'Optics',          icon: Search },
        { id: 'accessories', label: 'Accessories',     icon: Shield },
        { id: 'gear',        label: 'Reloading Gear',  icon: Package },
      ]
    },
    {
      label: 'Shooting',
      items: [
        { id: 'loads',    label: 'Load Development', icon: Package },
        { id: 'range',    label: 'Range Session',    icon: Target },
        { id: 'calendar', label: 'Match Calendar',   icon: Calendar },
      ]
    },
    {
      label: 'Analysis',
      items: [
        { id: 'history',  label: 'Session History',  icon: Calendar },
        { id: 'analysis', label: 'Load Analysis',    icon: BarChart3 },
        { id: 'targets',  label: 'Target Analysis',  icon: Crosshair },
        { id: 'dashboard',label: 'Dashboard',        icon: BarChart2 },
      ]
    },
    {
      label: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-${settings.theme}-950 text-slate-100 font-sans`}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-amber-400 tracking-widest uppercase">NODE</span>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white">
                    <Menu className="mr-2 h-4 w-4" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-slate-200 max-h-[70vh] overflow-y-auto">
                  {navGroups.map((group, groupIndex) => (
                    <div key={group.label}>
                      <DropdownMenuLabel className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        {group.label}
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className="cursor-pointer focus:bg-amber-900/20 focus:text-amber-400"
                            >
                              <Icon className="mr-2 h-4 w-4 text-slate-400" />
                              <span className="flex-1">{item.label}</span>
                              {activeTab === item.id && (
                                <Check className="h-4 w-4 text-amber-400" />
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuGroup>
                      {groupIndex < navGroups.length - 1 && (
                        <DropdownMenuSeparator className="bg-slate-800" />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <span className="text-sm text-slate-400 hidden sm:block">{settings.userName}</span>
                {settings.userProfilePicture ? (
                  <img
                    src={settings.userProfilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                    {settings.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logo / Banner section */}
      <div className="border-b border-slate-800 bg-slate-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <img
            src="/node-banner.jpg"
            alt="NODE"
            className="w-full max-h-40 object-contain rounded-xl opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'rifles'      && <RifleManager rifles={rifles} setRifles={setRifles} />}
        {activeTab === 'glass'       && <GlassManager glass={glass} setGlass={setGlass} />}
        {activeTab === 'accessories' && <Accessories accessories={accessories} setAccessories={setAccessories} />}
        {activeTab === 'gear'        && <ReloadingGear gear={gear} setGear={setGear} />}
        {activeTab === 'loads'       && <LoadDevelopment loads={loads} setLoads={setLoads} gear={gear} />}
        {activeTab === 'range'       && (
          <RangeSessionLogger sessions={sessions} setSessions={setSessions} rifles={rifles} loads={loads} />
        )}
        {activeTab === 'calendar'    && <MatchCalendar matches={matches} setMatches={setMatches} />}
        {activeTab === 'history'     && <SessionHistory sessions={sessions} setSessions={setSessions} rifles={rifles} loads={loads} />}
        {activeTab === 'analysis'    && <LoadAnalysis sessions={sessions} rifles={rifles} loads={loads} />}
        {activeTab === 'targets'     && <TargetAnalysisTool onSaveAnalysis={handleSaveTargetAnalysis} />}
        {activeTab === 'dashboard'   && <Dashboard sessions={sessions} rifles={rifles} loads={loads} />}
        {activeTab === 'settings'    && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            setRifles={setRifles}
            setLoads={setLoads}
            setGear={setGear}
            setSessions={setSessions}
            setMatches={setMatches}
            setAccessories={setAccessories}
            setGlass={setGlass}
          />
        )}
      </main>
    </div>
  );
}

export default App;
