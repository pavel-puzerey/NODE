import './fonts.css';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileMenu } from './components/auth/ProfileMenu';
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
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRifles, useLoads, useGear, useAccessories, useGlass, useSessions, useMatches } from './hooks/useSupabaseData';
import { UserSettings } from './types';
import { Target, Package, Calendar, Settings as SettingsIcon, Shield, Search, BarChart2, BarChart3, Menu, Check } from 'lucide-react';
import { Button } from './components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';

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
  const { profile } = useAuth();
  const [activeTab, setActiveTab]           = useLocalStorage<string>('node-active-tab', 'dashboard');
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

  useEffect(() => {
    if (profile) applyTheme(profile.theme || 'slate', profile.accent || 'amber', profile.dark_mode ?? true)
  }, [profile])

  const handleThemeChange = (theme: string, accent: string, darkMode: boolean) => {
    applyTheme(theme, accent, darkMode)
  }

  const navGroups = [
    { label: 'Equipment', items: [
      { id: 'rifles',      label: 'Rifles',        icon: Target      },
      { id: 'glass',       label: 'Optics',         icon: Search      },
      { id: 'accessories', label: 'Accessories',    icon: Shield      },
      { id: 'gear',        label: 'Reloading Gear', icon: Package     },
    ]},
    { label: 'Shooting', items: [
      { id: 'loads',    label: 'Load Development', icon: Package  },
      { id: 'range',    label: 'Range Session',    icon: Target   },
      { id: 'calendar', label: 'Match Calendar',   icon: Calendar },
    ]},
    { label: 'Analysis', items: [
      { id: 'history',   label: 'Session History', icon: Calendar  },
      { id: 'analysis',  label: 'Load Analysis',   icon: BarChart3 },
      { id: 'dashboard', label: 'Dashboard',       icon: BarChart2 },
    ]},
    { label: 'System', items: [
      { id: 'settings', label: 'Data Management', icon: SettingsIcon },
    ]},
  ];

  return (
    <div className="min-h-screen text-slate-100 font-sans">
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50" style={{backgroundColor:"#0a0a0a"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-lg font-bold tracking-widest uppercase">
              <span style={{ color: '#f59e0b' }}>N</span><span style={{ color: 'white' }}>otebook </span>
              <span style={{ color: '#f59e0b' }}>O</span><span style={{ color: 'white' }}>n </span>
              <span style={{ color: '#f59e0b' }}>D</span><span style={{ color: 'white' }}>ata & </span>
              <span style={{ color: '#f59e0b' }}>E</span><span style={{ color: 'white' }}>quipment</span>
            </span>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white">
                    <Menu className="mr-2 h-4 w-4" />Menu
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
                              {activeTab === item.id && <Check className="h-4 w-4" style={{ color: '#f59e0b' }} />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuGroup>
                      {groupIndex < navGroups.length - 1 && <DropdownMenuSeparator className="bg-slate-800" />}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="pl-4 border-l border-slate-800">
                <ProfileMenu
                  onThemeChange={handleThemeChange}
                  currentTheme={profile?.theme || 'slate'}
                  currentAccent={profile?.accent || 'amber'}
                  darkMode={profile?.dark_mode ?? true}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-800 py-6" style={{backgroundColor:"#0a0a0a"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3">
          <img
            src="/node-banner.jpg"
            alt="NODE"
            className="w-full max-h-40 object-contain rounded-xl opacity-90"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'rifles'      && <RifleManager rifles={rifles} setRifles={setRifles} />}
        {activeTab === 'glass'       && <GlassManager glass={glass} setGlass={setGlass} />}
        {activeTab === 'accessories' && <Accessories accessories={accessories} setAccessories={setAccessories} />}
        {activeTab === 'gear'        && <ReloadingGear gear={gear} setGear={setGear} />}
        {activeTab === 'loads'       && <LoadDevelopment loads={loads} setLoads={setLoads} gear={gear} />}
        {activeTab === 'range'       && <RangeSessionLogger sessions={sessions} setSessions={setSessions} rifles={rifles} loads={loads} />}
        {activeTab === 'calendar'    && <MatchCalendar matches={matches} setMatches={setMatches} />}
        {activeTab === 'history'     && <SessionHistory sessions={sessions} setSessions={setSessions} rifles={rifles} loads={loads} />}
        {activeTab === 'analysis'    && <LoadAnalysis sessions={sessions} rifles={rifles} loads={loads} />}
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

      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-700 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>
            © {new Date().getFullYear()} Pavel A. Puzerey. All rights reserved.
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