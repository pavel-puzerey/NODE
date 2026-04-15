export interface Rifle {
  id: string;
  userId: string;
  action: string;
  caliber: string;
  barrelBrand: string;
  barrelLength: number;
  chassis: string;
  trigger: string;
  createdAt: string;
}

export interface Load {
  id: string;
  userId: string;
  bulletId: string;
  caseId: string;
  powderId: string;
  primerId: string;
  charge: number;
  oal: number;
  seatingDepthIn: number;
  neckTensionIn: number;
  notes?: string;
  createdAt: string;
}

export interface RangeGroup {
  id: string;
  groupId: number;
  groupSize: number;
  extremeSpread: number;
  groupSd: number;
  rounds: number;
  velocityEs: number;
  velocitySd: number;
  velocities?: number[];
}

export interface EnvironmentalConditions {
  temperature: number;   // Fahrenheit
  windSpeed: number;     // mph
  windDirection: string; // e.g. "N", "NE", "Variable"
  humidity: number;      // %
  pressure?: number;     // inHg
}

export interface RangeSession {
  id: string;
  rifleId: string;
  loadId: string;
  sessionDate: string;
  notes?: string;
  conditions?: EnvironmentalConditions;
  groups: RangeGroup[];
  createdAt: string;
}

export interface GearItem {
  id: string;
  userId: string;
  gearType: 'Bullet' | 'Case' | 'Powder' | 'Primer' | 'Reloading Press' | 'Sizing Die' | 'Seating Die' | 'Scale' | 'Trickler' | 'Annealer' | 'Primer Tool' | 'Case Cleaning System' | 'Case Trimmer' | 'Headspace Comparator' | 'Bullet Comparator' | 'Bullet Puller';
  brand: string;
  model: string;
  weight?: number;
  diameter?: number;
  lot?: string;
  primerSize?: string;
  notes?: string;
  createdAt: string;
}

// FIX: unified on accessoryType (was split between accessoryType and category)
export interface Accessory {
  id: string;
  userId: string;
  accessoryType: 'Bipod' | 'Suppressor' | 'Muzzle Brake' | 'Shooting Bag' | 'Sling' | 'Chronograph' | 'Tripod' | 'Rifle Case' | 'Magazines' | 'Scope Mount' | 'Shooting Mat' | 'Timer' | 'Level' | 'Other';
  brand: string;
  model: string;
  weight?: number;
  notes?: string;
  createdAt: string;
}

export interface Glass {
  id: string;
  userId: string;
  type: 'rifle-scope' | 'spotting-scope' | 'binoculars' | 'rangefinder';
  brand: string;
  model: string;
  magnification?: string;
  reticle?: string;
  tubeSize?: string;
  turretType?: string;
  objectiveLens?: string;
  eyepiece?: string;
  hasReticle?: boolean;
  prismType?: 'Roof' | 'Porro';
  fieldOfView?: string;
  weight?: string;
  maxRange?: string;
  angleComp?: boolean;
  ballisticCalc?: boolean;
  notes?: string;
  createdAt: string;
}

export interface UserSettings {
  theme: string;
  userName: string;
  userAvatar: string | null;
  userProfilePicture: string | null;
  email: string;
  password: string;
  shootingClass: string;
  memberships: string[];
}

export interface MatchEvent {
  id: string;
  name: string;
  date: string;
  time: string | null;
  isAllDay: boolean;
  reminder: 'none' | '1day' | '1week' | '1month';
  notes?: string;
}

export interface BackupData {
  version: string;
  timestamp: string;
  rifles: Rifle[];
  loads: Load[];
  gear: GearItem[];
  sessions: RangeSession[];
  matches: MatchEvent[];
  accessories: Accessory[];
  glass: Glass[];
  settings: UserSettings;
}

export interface Point {
  x: number;
  y: number;
}

