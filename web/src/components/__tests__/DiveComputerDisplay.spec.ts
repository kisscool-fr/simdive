import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DiveComputerDisplay from '../DiveComputerDisplay.vue';
import type { DiveState, LayoutConfig, DisplayMode } from '../../types/dive';

// Mock dive state for testing
const createMockDiveState = (overrides: Partial<DiveState> = {}): DiveState => ({
  currentTime: 15.5,
  currentDepth: 25.3,
  maxDepth: 28.7,
  deco: {
    tissues: [],
    ndl: 12,
    ceiling: 0,
    decoStops: [],
    tts: 5,
    gfLow: 0.3,
    gfHigh: 0.85,
  },
  air: {
    initialTankPressure: 200,
    tankPressure: 150,
    remainingAirTime: 35,
    currentSacRate: 18,
    averageSacRate: 17,
    airConsumed: 50,
  },
  ascent: {
    rate: -2,
    isViolation: false,
    maxAllowedRate: 10,
  },
  safetyStop: {
    required: false,
    active: false,
    depth: 5,
    duration: 180,
    remaining: 0,
  },
  activeWarnings: [],
  ...overrides,
});

const createMockLayout = (overrides: Partial<LayoutConfig> = {}): LayoutConfig => ({
  id: 'test-layout',
  name: 'Test Layout',
  description: 'Test layout for unit tests',
  grid: { columns: 2, gap: '16px' },
  header: { title: 'TestDive', showModeToggle: true },
  cells: [
    { type: 'depth', span: 2, primary: true, showMax: true, label: 'Profondeur' },
    { type: 'time', label: 'Temps' },
    { type: 'ndl', label: 'NDL', labelDeco: 'Palier' },
    { type: 'air', showGauge: true, label: 'Pression' },
    { type: 'autonomy', label: 'Autonomie' },
  ],
  sections: { safetyStop: true, decoStops: 'expert', warnings: true },
  theme: {},
  ...overrides,
});

describe('DiveComputerDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders dive-computer container', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
        },
      });

      expect(wrapper.find('.dive-computer').exists()).toBe(true);
    });

    it('renders header with title', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
        },
      });

      expect(wrapper.find('.dive-computer-header').exists()).toBe(true);
      expect(wrapper.find('.dive-computer-title').exists()).toBe(true);
    });

    it('uses layout title when provided', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            header: { title: 'CustomTitle', showModeToggle: true },
          }),
        },
      });

      expect(wrapper.find('.dive-computer-title').text()).toBe('CustomTitle');
    });

    it('shows no-data state when diveState is null', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: null,
          displayMode: 'essential' as DisplayMode,
        },
      });

      expect(wrapper.find('.no-data').exists()).toBe(true);
      expect(wrapper.find('.display-content').exists()).toBe(false);
    });

    it('shows display content when diveState is provided', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
        },
      });

      expect(wrapper.find('.display-content').exists()).toBe(true);
      expect(wrapper.find('.no-data').exists()).toBe(false);
    });
  });

  describe('Layout Configuration', () => {
    it('uses default layout when layoutConfig is not provided', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
        },
      });

      // Default layout has SimDive title
      expect(wrapper.find('.dive-computer-title').text()).toBe('SimDive');
    });

    it('applies grid columns from layout config', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({ grid: { columns: 3, gap: '12px' } }),
        },
      });

      const grid = wrapper.find('.display-grid');
      expect(grid.attributes('style')).toContain('grid-template-columns: repeat(3, 1fr)');
    });

    it('applies grid gap from layout config', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({ grid: { columns: 2, gap: '24px' } }),
        },
      });

      const grid = wrapper.find('.display-grid');
      expect(grid.attributes('style')).toContain('gap: 24px');
    });

    it('renders correct number of cells', () => {
      const layoutWithThreeCells = createMockLayout({
        cells: [
          { type: 'depth', label: 'Depth' },
          { type: 'time', label: 'Time' },
          { type: 'air', label: 'Air' },
        ],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: layoutWithThreeCells,
        },
      });

      const cells = wrapper.findAllComponents({ name: 'DisplayCell' });
      expect(cells.length).toBe(3);
    });
  });

  describe('Display Mode Filtering', () => {
    it('shows only essential cells in essential mode', () => {
      const layoutWithMixedCells = createMockLayout({
        cells: [
          { type: 'depth', label: 'Depth' }, // No mode = show in both
          { type: 'time', label: 'Time' }, // No mode = show in both
          { type: 'tts', mode: 'expert', label: 'TTS' }, // Expert only
          { type: 'sac', mode: 'expert', label: 'SAC' }, // Expert only
        ],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: layoutWithMixedCells,
        },
      });

      const cells = wrapper.findAllComponents({ name: 'DisplayCell' });
      // Should only show 2 cells (depth and time), not the expert-only ones
      expect(cells.length).toBe(2);
    });

    it('shows all cells including expert in expert mode', () => {
      const layoutWithMixedCells = createMockLayout({
        cells: [
          { type: 'depth', label: 'Depth' },
          { type: 'time', label: 'Time' },
          { type: 'tts', mode: 'expert', label: 'TTS' },
          { type: 'sac', mode: 'expert', label: 'SAC' },
        ],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'expert' as DisplayMode,
          layoutConfig: layoutWithMixedCells,
        },
      });

      const cells = wrapper.findAllComponents({ name: 'DisplayCell' });
      // Should show all 4 cells in expert mode
      expect(cells.length).toBe(4);
    });

    it('hides ceiling cell when ceiling is 0', () => {
      const layoutWithCeiling = createMockLayout({
        cells: [
          { type: 'depth', label: 'Depth' },
          { type: 'ceiling', mode: 'expert', label: 'Ceiling' },
        ],
      });

      const diveState = createMockDiveState({
        deco: { ...createMockDiveState().deco, ceiling: 0 },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'expert' as DisplayMode,
          layoutConfig: layoutWithCeiling,
        },
      });

      const cells = wrapper.findAllComponents({ name: 'DisplayCell' });
      // Ceiling should be hidden when value is 0
      expect(cells.length).toBe(1);
    });

    it('shows ceiling cell when ceiling > 0', () => {
      const layoutWithCeiling = createMockLayout({
        cells: [
          { type: 'depth', label: 'Depth' },
          { type: 'ceiling', mode: 'expert', label: 'Ceiling' },
        ],
      });

      const diveState = createMockDiveState({
        deco: { ...createMockDiveState().deco, ceiling: 6 },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'expert' as DisplayMode,
          layoutConfig: layoutWithCeiling,
        },
      });

      const cells = wrapper.findAllComponents({ name: 'DisplayCell' });
      expect(cells.length).toBe(2);
    });
  });

  describe('Safety Stop Section', () => {
    it('shows safety stop when active and enabled in layout', () => {
      const diveState = createMockDiveState({
        safetyStop: {
          required: true,
          active: true,
          depth: 5,
          duration: 180,
          remaining: 120,
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: false, warnings: true },
          }),
        },
      });

      expect(wrapper.find('.safety-stop').exists()).toBe(true);
    });

    it('hides safety stop when disabled in layout', () => {
      const diveState = createMockDiveState({
        safetyStop: {
          required: true,
          active: true,
          depth: 5,
          duration: 180,
          remaining: 120,
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: false, decoStops: false, warnings: true },
          }),
        },
      });

      expect(wrapper.find('.safety-stop').exists()).toBe(false);
    });

    it('hides safety stop when not active', () => {
      const diveState = createMockDiveState({
        safetyStop: {
          required: false,
          active: false,
          depth: 5,
          duration: 180,
          remaining: 0,
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.find('.safety-stop').exists()).toBe(false);
    });

    it('displays safety stop time correctly', () => {
      const diveState = createMockDiveState({
        safetyStop: {
          required: true,
          active: true,
          depth: 5,
          duration: 180,
          remaining: 125, // 2:05
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.find('.safety-stop .lcd-value').text()).toContain('2:05');
    });
  });

  describe('Deco Stops Section', () => {
    it('shows deco stops in expert mode when configured', () => {
      const diveState = createMockDiveState({
        deco: {
          ...createMockDiveState().deco,
          decoStops: [
            { depth: 6, duration: 3 },
            { depth: 3, duration: 5 },
          ],
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'expert' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: 'expert', warnings: true },
          }),
        },
      });

      expect(wrapper.find('.deco-stops').exists()).toBe(true);
      expect(wrapper.findAll('.deco-stop').length).toBe(2);
    });

    it('hides deco stops in essential mode when configured for expert only', () => {
      const diveState = createMockDiveState({
        deco: {
          ...createMockDiveState().deco,
          decoStops: [{ depth: 6, duration: 3 }],
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: 'expert', warnings: true },
          }),
        },
      });

      expect(wrapper.find('.deco-stops').exists()).toBe(false);
    });

    it('shows deco stops in all modes when configured as true', () => {
      const diveState = createMockDiveState({
        deco: {
          ...createMockDiveState().deco,
          decoStops: [{ depth: 6, duration: 3 }],
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: true, warnings: true },
          }),
        },
      });

      expect(wrapper.find('.deco-stops').exists()).toBe(true);
    });

    it('hides deco stops when no stops are required', () => {
      const diveState = createMockDiveState({
        deco: {
          ...createMockDiveState().deco,
          decoStops: [],
        },
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'expert' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.find('.deco-stops').exists()).toBe(false);
    });
  });

  describe('Warnings Section', () => {
    it('shows warnings when present and enabled', () => {
      const diveState = createMockDiveState({
        activeWarnings: [{ type: 'warning', message: 'Low air warning', code: 'LOW_AIR' }],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: false, warnings: true },
          }),
        },
      });

      expect(wrapper.find('.warnings-panel').exists()).toBe(true);
    });

    it('hides warnings when disabled in layout', () => {
      const diveState = createMockDiveState({
        activeWarnings: [{ type: 'warning', message: 'Low air warning', code: 'LOW_AIR' }],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({
            sections: { safetyStop: true, decoStops: false, warnings: false },
          }),
        },
      });

      expect(wrapper.find('.warnings-panel').exists()).toBe(false);
    });

    it('hides warnings when no warnings are active', () => {
      const diveState = createMockDiveState({
        activeWarnings: [],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.find('.warnings-panel').exists()).toBe(false);
    });

    it('displays multiple warnings', () => {
      const diveState = createMockDiveState({
        activeWarnings: [
          { type: 'warning', message: 'Low air', code: 'LOW_AIR' },
          { type: 'critical', message: 'Ascent too fast', code: 'FAST_ASCENT' },
        ],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.findAll('.warning-item').length).toBe(2);
    });

    it('applies correct warning type classes', () => {
      const diveState = createMockDiveState({
        activeWarnings: [{ type: 'critical', message: 'Critical warning', code: 'CRITICAL' }],
      });

      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState,
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout(),
        },
      });

      expect(wrapper.find('.warning-icon.critical').exists()).toBe(true);
      expect(wrapper.find('.warning-text.critical').exists()).toBe(true);
    });
  });

  describe('Mode Toggle Slot', () => {
    it('renders mode-toggle slot when showModeToggle is true', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({ header: { title: 'Test', showModeToggle: true } }),
        },
        slots: {
          'mode-toggle': '<div class="test-toggle">Toggle</div>',
        },
      });

      expect(wrapper.find('.test-toggle').exists()).toBe(true);
    });

    it('does not render mode-toggle slot when showModeToggle is false', () => {
      const wrapper = mount(DiveComputerDisplay, {
        props: {
          diveState: createMockDiveState(),
          displayMode: 'essential' as DisplayMode,
          layoutConfig: createMockLayout({ header: { title: 'Test', showModeToggle: false } }),
        },
        slots: {
          'mode-toggle': '<div class="test-toggle">Toggle</div>',
        },
      });

      expect(wrapper.find('.test-toggle').exists()).toBe(false);
    });
  });
});
