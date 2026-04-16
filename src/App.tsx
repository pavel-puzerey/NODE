import './fonts.css';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileMenu } from './components/auth/ProfileMenu';
import { RifleManager } from './components/RifleManager';
import { LoadDevelopment } from './components/LoadDevelopment';
import { RangeSessionLogger } from './components/RangeSession';
import { ReloadingGear } from './components/ReloadingGear';
import { Accessories } from './components/Accessories';
import { GlassManager } from './components/GlassManager';
import { Settings } from './components/Settings';
import { MatchCalendar } from './components/MatchCalendar';
import { LoadAnalysis } from './components/LoadAnalysis';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRifles, useLoads, useGear, useAccessories, useGlass, useSessions, useMatches } from './hooks/useSupabaseData';
import { UserSettings } from './types';
import { Target, Package, Calendar, Settings as SettingsIcon, Shield, Search, BarChart3, Menu, X, Crosshair, Wrench, Gauge } from 'lucide-react';
import { Button } from './components/ui/button';
import { useState } from 'react';
import { AppTour } from './components/AppTour';
import { Dope } from './components/Dope';
import { CleaningLog } from './components/CleaningLog';
import { TorqueLog } from './components/TorqueLog';
import { AmmoInventory, AmmoItem } from './components/AmmoInventory';

const ACCENT_VARS: Record<string, { DEFAULT: string; light: string; dim: string }> = {
  amber:   { DEFAULT: '217 119 6',   light: '251 191 36',  dim: '120 53 15'  },
  emerald: { DEFAULT: '5 150 105',   light: '52 211 153',  dim: '6 78 59'    },
  blue:    { DEFAULT: '37 99 235',   light: '96 165 250',  dim: '30 58 138'  },
  red:     { DEFAULT: '220 38 38',   light: '252 165 165', dim: '127 29 29'  },
  violet:  { DEFAULT: '124 58 237',  light: '196 181 253', dim: '76 29 149'  },
  cyan:    { DEFAULT: '8 145 178',   light: '103 232 249', dim: '22 78 99'   },
  rose:    { DEFAULT: '225 29 72',   light: '253 164 175', dim: '136 19 55'  },
  orange:  { DEFAULT: '234 88 12',   light: '253 186 116', dim: '124 45 18'  },
  lime:    { DEFAULT: '101 163 13',  light: '190 242 100', dim: '54 83 20'   },
  pink:    { DEFAULT: '219 39 119',  light: '249 168 212', dim: '131 24 67'  },
  indigo:  { DEFAULT: '79 70 229',   light: '165 180 252', dim: '49 46 129'  },
  teal:    { DEFAULT: '13 148 136',  light: '94 234 212',  dim: '19 78 74'   },
}

function applyTheme(_theme: string, _accent: string, _darkMode: boolean) {
  // Fixed palette: tungsten background, bronze text
  document.body.style.backgroundColor = '#0a0a0a'
  document.body.style.color = '#C9A84C'
}

// ── Inner app — only renders when user is confirmed logged in ─────────────────
function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const { profile } = useAuth();
  const [activeTab, setActiveTab]           = useLocalStorage<string>('node-active-tab', '');
  const [settings, setSettings]             = useLocalStorage<UserSettings>('precision-settings', {
    theme: 'slate', userName: 'Shooter', userAvatar: null,
    userProfilePicture: null, email: '', password: '', shootingClass: '', memberships: [],
  });

  const [rifles, setRifles]           = useRifles();
  const [loads, setLoads]             = useLoads();
  const [gear, setGear]               = useGear();
  const [accessories, setAccessories] = useAccessories();
  const [glass, setGlass]             = useGlass();
  const [sessions, setSessions]       = useSessions();
  const [matches, setMatches]         = useMatches();
  const [ammo, setAmmo]               = useState<AmmoItem[]>([]);

  useEffect(() => {
    if (profile) applyTheme(profile.theme || 'slate', profile.accent || 'amber', profile.dark_mode ?? true)
  }, [profile])

  const handleThemeChange = (theme: string, accent: string, darkMode: boolean) => {
    applyTheme(theme, accent, darkMode)
  }

  const navGroups = [
    { label: 'Equipment', items: [
      { id: 'rifles',      label: 'Rifles',        icon: Target    },
      { id: 'glass',       label: 'Optics',        icon: Search    },
      { id: 'accessories', label: 'Accessories',   icon: Shield    },
      { id: 'gear',        label: 'Reloading Gear', icon: Package  },
      { id: 'ammo',        label: 'Ammo Inventory', icon: Package  },
      { id: 'torque',      label: 'Torque Specs',  icon: Gauge     },
    ]},
    { label: 'Shooting', items: [
      { id: 'dope',     label: 'DOPE',           icon: Crosshair },
      { id: 'range',    label: 'Range Session',  icon: Target    },
      { id: 'calendar', label: 'Match Calendar', icon: Calendar  },
    ]},
    { label: 'Load Development', items: [
      { id: 'loads',    label: 'Load Recipes',  icon: Package   },
      { id: 'analysis', label: 'Load Analysis', icon: BarChart3 },
    ]},
    { label: 'Maintenance', items: [
      { id: 'cleaning', label: 'Cleaning Log', icon: Wrench },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Data Management', icon: SettingsIcon },
    ]},
  ];

  return (
    <div className="min-h-screen text-slate-100 font-sans">
      {tourOpen && <AppTour onClose={() => setTourOpen(false)} />}

      {/* Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-in sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0d0d0d' }}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 flex-shrink-0">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Navigation</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-amber-500/80 text-xs font-bold uppercase tracking-widest px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                        isActive
                          ? 'bg-amber-900/30 text-amber-400 font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30" style={{backgroundColor:"#0a0a0a"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white hover:bg-slate-800 px-2">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="text-lg font-bold tracking-widest uppercase">
                <span className="hidden sm:inline">
                  <span style={{ color: '#f59e0b' }}>N</span><span style={{ color: 'white' }}>otebook </span>
                  <span style={{ color: '#f59e0b' }}>O</span><span style={{ color: 'white' }}>n </span>
                  <span style={{ color: '#f59e0b' }}>D</span><span style={{ color: 'white' }}>ata & </span>
                  <span style={{ color: '#f59e0b' }}>E</span><span style={{ color: 'white' }}>quipment</span>
                </span>
                <span className="sm:hidden">
                  <span style={{ color: '#f59e0b' }}>N</span>
                  <span style={{ color: '#f59e0b' }}>O</span>
                  <span style={{ color: '#f59e0b' }}>D</span>
                  <span style={{ color: '#f59e0b' }}>E</span>
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <button
                onClick={() => setTourOpen(true)}
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors tracking-widest uppercase"
              >
                Tour
              </button>
              <ProfileMenu
                onThemeChange={handleThemeChange}
                currentTheme={profile?.theme || 'slate'}
                currentAccent={profile?.accent || 'amber'}
                darkMode={profile?.dark_mode ?? true}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-800 py-3 sm:py-6" style={{backgroundColor:"#0a0a0a"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3">
          <img
            src="/node-banner.jpg"
            alt="NODE"
            className="w-full max-h-24 sm:max-h-40 object-contain rounded-xl opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <p style={{ fontFamily: 'Oswald, sans-serif' }} className="text-2xl tracking-widest uppercase font-semibold">
            <span style={{ color: '#f59e0b' }}>N</span><span style={{ color: 'white' }}>otebook </span>
            <span style={{ color: '#f59e0b' }}>O</span><span style={{ color: 'white' }}>n </span>
            <span style={{ color: '#f59e0b' }}>D</span><span style={{ color: 'white' }}>ata & </span>
            <span style={{ color: '#f59e0b' }}>E</span><span style={{ color: 'white' }}>quipment</span>
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8" style={{ minHeight: '60vh' }}>
        {activeTab === 'rifles'      && <RifleManager rifles={rifles} setRifles={setRifles} sessions={sessions} />}
        {activeTab === 'glass'       && <GlassManager glass={glass} setGlass={setGlass} />}
        {activeTab === 'accessories' && <Accessories accessories={accessories} setAccessories={setAccessories} />}
        {activeTab === 'gear'        && <ReloadingGear gear={gear} setGear={setGear} />}
        {activeTab === 'ammo'        && <AmmoInventory loads={loads} ammo={ammo} setAmmo={setAmmo} sessions={sessions} />}
        {activeTab === 'torque'      && <TorqueLog rifles={rifles} />}
        {activeTab === 'loads'       && <LoadDevelopment loads={loads} setLoads={setLoads} gear={gear} />}
        {activeTab === 'dope'        && <Dope rifles={rifles} />}
        {activeTab === 'range'       && <RangeSessionLogger sessions={sessions} setSessions={setSessions} rifles={rifles} loads={loads} ammo={ammo} setAmmo={setAmmo} />}
        {activeTab === 'calendar'    && <MatchCalendar matches={matches} setMatches={setMatches} />}
        {activeTab === 'analysis'    && <LoadAnalysis sessions={sessions} rifles={rifles} loads={loads} />}
        {activeTab === 'cleaning'    && <CleaningLog rifles={rifles} />}
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

      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-700 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>
            © {new Date().getFullYear()} product_by_process All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Outer shell — handles auth state before rendering anything ────────────────
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:"#0a0a0a"}}>
        <div className="text-amber-400 text-sm tracking-widest uppercase animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user) {
    document.body.style.backgroundColor = '#0a0a0a'
    document.body.style.color = '#C9A84C'
    return <AuthScreen />
  }

  return <AppInner />
}

export default App;