// Dive Profile Configuration Types

export interface Waypoint {
  time: number; // Time in minutes from dive start
  depth: number; // Depth in meters
}

export type DiveEventType =
  | 'breathingRateIncrease' // Essoufflement - increased SAC rate
  | 'breathingRateDecrease' // Return to normal breathing
  | 'airSharing' // Buddy breathing - doubled consumption
  | 'airSharingEnd' // End of buddy breathing
  | 'lowAirWarning' // Tank pressure warning trigger
  | 'criticalAirWarning' // Critical tank pressure
  | 'rapidAscent' // Ascent rate violation
  | 'safetyStopStart' // Begin safety stop
  | 'safetyStopEnd'; // End safety stop

export interface DiveEvent {
  time: number; // Time in minutes when event occurs
  type: DiveEventType;
  value?: number; // Optional value (e.g., breathing rate multiplier)
  message?: string; // Optional message to display
}

export interface DiveProfile {
  id: string;
  name: string;
  description: string;
  initialTankPressure: number; // Bar
  tankVolume: number; // Liters (typical: 12L or 15L)
  sacRate: number; // Surface Air Consumption in liters/min
  waypoints: Waypoint[];
  events: DiveEvent[];
}

export interface DiveProfilesConfig {
  profiles: DiveProfile[];
}

// Bühlmann ZHL-16C Tissue Compartment
export interface TissueCompartment {
  halfTime: number; // Half-time in minutes for N2
  a: number; // Bühlmann 'a' coefficient
  b: number; // Bühlmann 'b' coefficient
  pN2: number; // Current N2 partial pressure in tissue (bar)
}

// Decompression State
export interface DecoState {
  tissues: TissueCompartment[];
  ndl: number; // No-Deco Limit in minutes (-1 if in deco)
  ceiling: number; // Ceiling depth in meters (0 if no deco required)
  decoStops: DecoStop[];
  tts: number; // Time To Surface in minutes
  gfLow: number; // Gradient Factor Low (default 0.3)
  gfHigh: number; // Gradient Factor High (default 0.85)
}

export interface DecoStop {
  depth: number; // Stop depth in meters
  duration: number; // Stop duration in minutes
}

// Air Consumption State
export interface AirState {
  initialTankPressure: number; // Initial tank pressure in bar
  tankPressure: number; // Current tank pressure in bar
  remainingAirTime: number; // Remaining air time at current depth/rate in minutes
  currentSacRate: number; // Current SAC rate (may be modified by events)
  averageSacRate: number; // Average SAC rate during dive
  airConsumed: number; // Total air consumed in bar
}

// Ascent Rate
export interface AscentState {
  rate: number; // Current ascent/descent rate in m/min
  isViolation: boolean; // True if ascending too fast (>10m/min)
  maxAllowedRate: number; // Maximum allowed ascent rate
}

// Safety Stop State
export interface SafetyStopState {
  required: boolean; // Whether safety stop is required
  active: boolean; // Currently performing safety stop
  depth: number; // Safety stop depth (typically 5m)
  duration: number; // Required duration in seconds
  remaining: number; // Remaining time in seconds
}

// Complete Dive State at any moment
export interface DiveState {
  // Basic info
  currentTime: number; // Current time in minutes
  currentDepth: number; // Current depth in meters
  maxDepth: number; // Maximum depth reached

  // Decompression
  deco: DecoState;

  // Air management
  air: AirState;

  // Ascent monitoring
  ascent: AscentState;

  // Safety stop
  safetyStop: SafetyStopState;

  // Active events/warnings
  activeWarnings: DiveWarning[];
}

export interface DiveWarning {
  type: 'info' | 'warning' | 'critical';
  message: string;
  code: string;
}

// Playback Control
export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10;

export interface PlaybackControl {
  state: PlaybackState;
  speed: PlaybackSpeed;
  currentTime: number; // Current simulation time in minutes
  totalTime: number; // Total dive duration in minutes
  stepSize: number; // Step size for manual navigation (in seconds)
}

// Display Mode
export type DisplayMode = 'essential' | 'expert';

// Layout Configuration Types

/** Available cell types for dive computer display */
export type CellType =
  | 'depth'
  | 'time'
  | 'ndl'
  | 'air'
  | 'autonomy'
  | 'tts'
  | 'ceiling'
  | 'ascentRate'
  | 'sac';

/** Configuration for a single display cell */
export interface LayoutCell {
  type: CellType;
  span?: number; // Grid column span (default: 1)
  primary?: boolean; // Use primary/highlighted styling
  mode?: DisplayMode; // Only show in this display mode
  showMax?: boolean; // For depth: show max depth subtitle
  showGauge?: boolean; // For air: show gauge bar
  label?: string; // Custom label override
  labelDeco?: string; // Alternative label when in deco (for NDL cell)
}

/** Grid configuration for layout */
export interface LayoutGrid {
  columns: number;
  gap: string;
}

/** Header configuration */
export interface LayoutHeader {
  title: string;
  showModeToggle: boolean;
}

/** Section visibility configuration */
export interface LayoutSections {
  safetyStop: boolean;
  decoStops: boolean | DisplayMode; // true = always, false = never, DisplayMode = only in that mode
  warnings: boolean;
}

/** Theme color configuration */
export interface LayoutTheme {
  bgPrimary?: string;
  bgSecondary?: string;
  bgPanel?: string;
  bgLcd?: string;
  lcdText?: string;
  lcdTextDim?: string;
  lcdWarning?: string;
  lcdCritical?: string;
  lcdInfo?: string;
  accentCyan?: string;
  accentBlue?: string;
  accentPurple?: string;
  gaugeFull?: string;
  gaugeMid?: string;
  gaugeLow?: string;
  gaugeCritical?: string;
  [key: string]: string | undefined; // Allow additional custom theme variables
}

/** Complete layout configuration */
export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  grid: LayoutGrid;
  header: LayoutHeader;
  cells: LayoutCell[];
  sections: LayoutSections;
  theme: LayoutTheme;
}

/** Layout entry in the layouts index */
export interface LayoutIndexEntry {
  id: string;
  name: string;
  path: string;
}

/** Layouts index file structure */
export interface LayoutsIndex {
  layouts: LayoutIndexEntry[];
}

// Application State
export interface AppState {
  selectedProfile: DiveProfile | null;
  selectedLayout: LayoutConfig | null;
  playback: PlaybackControl;
  diveState: DiveState | null;
  displayMode: DisplayMode;
  isLoading: boolean;
  error: string | null;
}

// Constants
export const WATER_VAPOR_PRESSURE = 0.0627; // bar at 37°C
export const SURFACE_PRESSURE = 1.013; // bar at sea level
export const N2_FRACTION = 0.79; // Nitrogen fraction in air
export const O2_FRACTION = 0.21; // Oxygen fraction in air
export const METERS_TO_BAR = 0.1; // 10m of seawater = 1 bar
export const MAX_ASCENT_RATE = 10; // Maximum safe ascent rate in m/min
export const SAFETY_STOP_DEPTH = 5; // Safety stop depth in meters
export const SAFETY_STOP_DURATION = 180; // Safety stop duration in seconds (3 min)

// Bühlmann ZHL-16C Coefficients
export const BUHLMANN_ZHL16C: Omit<TissueCompartment, 'pN2'>[] = [
  { halfTime: 4.0, a: 1.2599, b: 0.505 },
  { halfTime: 8.0, a: 1.0, b: 0.6514 },
  { halfTime: 12.5, a: 0.8618, b: 0.7222 },
  { halfTime: 18.5, a: 0.7562, b: 0.7825 },
  { halfTime: 27.0, a: 0.62, b: 0.8126 },
  { halfTime: 38.3, a: 0.5043, b: 0.8434 },
  { halfTime: 54.3, a: 0.441, b: 0.8693 },
  { halfTime: 77.0, a: 0.4, b: 0.891 },
  { halfTime: 109.0, a: 0.375, b: 0.9092 },
  { halfTime: 146.0, a: 0.35, b: 0.9222 },
  { halfTime: 187.0, a: 0.3295, b: 0.9319 },
  { halfTime: 239.0, a: 0.3065, b: 0.9403 },
  { halfTime: 305.0, a: 0.2835, b: 0.9477 },
  { halfTime: 390.0, a: 0.261, b: 0.9544 },
  { halfTime: 498.0, a: 0.248, b: 0.9602 },
  { halfTime: 635.0, a: 0.2327, b: 0.9653 },
];
