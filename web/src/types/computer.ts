// Dive computer model types.
// A model only describes how a dive computer *looks* (shape, screens, widget placement,
// colours). Every model displays the same SimDive engine output (Bühlmann ZHL-16C).

/** Data a widget can display on a computer screen */
export type WidgetType =
  | 'depth'
  | 'maxDepth'
  | 'time'
  | 'ndl'
  | 'air'
  | 'autonomy'
  | 'tts'
  | 'ceiling'
  | 'ascentRate'
  | 'sac'
  | 'safetyStop'
  | 'decoStops'
  | 'warnings';

export const WIDGET_TYPES: readonly WidgetType[] = [
  'depth',
  'maxDepth',
  'time',
  'ndl',
  'air',
  'autonomy',
  'tts',
  'ceiling',
  'ascentRate',
  'sac',
  'safetyStop',
  'decoStops',
  'warnings',
];

/** Relative size of a widget's main value, scaled to the screen width */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export const WIDGET_SIZES: readonly WidgetSize[] = ['sm', 'md', 'lg', 'xl'];

/** A widget placed in a named area of a screen grid */
export interface ScreenWidget {
  area: string; // Name used in the screen's `areas` template
  type: WidgetType;
  size?: WidgetSize; // Default: 'md'
  label?: string; // Label override
  labelDeco?: string; // ndl only: label shown while in deco
  showMax?: boolean; // depth only: show max depth below the value
  showGauge?: boolean; // air only: show a gauge bar
  highlight?: boolean; // Emphasised styling (panel cell style only)
}

/** One page of the computer, cycled with the "next screen" button */
export interface ComputerScreen {
  id: string;
  name: string;
  columns?: string; // grid-template-columns, default: equal columns
  areas: string[]; // grid-template-areas rows, e.g. ["depth ndl", "depth time"]
  widgets: ScreenWidget[];
}

export type ScreenShape = 'rect' | 'round';

/** segment-lcd: monochrome digits, no glow; color: backlit colour screen */
export type DisplayTech = 'segment-lcd' | 'color';

/** panel: each widget in its own box; flat: widgets drawn directly on the screen */
export type CellStyle = 'panel' | 'flat';

export interface ComputerFormFactor {
  shape: ScreenShape;
  aspectRatio?: string; // CSS aspect-ratio for rect screens, e.g. "16 / 10"; round is always 1
  display: DisplayTech;
  cellStyle: CellStyle;
}

/** Colour overrides, applied as --dc-* CSS variables on the computer element only */
export interface ComputerTheme {
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
  gaugeFull?: string;
  gaugeMid?: string;
  gaugeLow?: string;
  gaugeCritical?: string;
}

export const THEME_KEYS: readonly (keyof ComputerTheme)[] = [
  'bgPrimary',
  'bgSecondary',
  'bgPanel',
  'bgLcd',
  'lcdText',
  'lcdTextDim',
  'lcdWarning',
  'lcdCritical',
  'lcdInfo',
  'accentCyan',
  'accentBlue',
  'gaugeFull',
  'gaugeMid',
  'gaugeLow',
  'gaugeCritical',
];

export interface ComputerModel {
  id: string;
  name: string;
  description: string;
  formFactor: ComputerFormFactor;
  screens: ComputerScreen[];
  theme?: ComputerTheme;
}

/** Entry of public/data/computers/index.json */
export interface ComputerModelIndexEntry {
  id: string;
  file: string; // Path relative to public/data/computers/
}

export interface ComputerModelsIndex {
  models: ComputerModelIndexEntry[];
}
