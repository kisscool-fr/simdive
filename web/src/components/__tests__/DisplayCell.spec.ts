import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DisplayCell from '../DisplayCell.vue';
import type { LayoutCell, DiveState } from '../../types/dive';

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

describe('DisplayCell', () => {
  describe('Depth Cell', () => {
    it('renders depth value with one decimal', () => {
      const cell: LayoutCell = { type: 'depth', label: 'Profondeur' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('25.3');
    });

    it('renders depth label', () => {
      const cell: LayoutCell = { type: 'depth', label: 'Profondeur' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-label').text()).toBe('Profondeur');
    });

    it('renders depth unit (m)', () => {
      const cell: LayoutCell = { type: 'depth', label: 'Profondeur' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-unit').text()).toBe('m');
    });

    it('shows max depth when showMax is true', () => {
      const cell: LayoutCell = { type: 'depth', label: 'Profondeur', showMax: true };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-sublabel').exists()).toBe(true);
      expect(wrapper.find('.lcd-sublabel').text()).toContain('Max: 28.7m');
    });

    it('hides max depth when showMax is false', () => {
      const cell: LayoutCell = { type: 'depth', label: 'Profondeur', showMax: false };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-sublabel').exists()).toBe(false);
    });

    it('applies primary class when primary is true', () => {
      const cell: LayoutCell = { type: 'depth', primary: true };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.display-cell').classes()).toContain('primary');
    });

    it('applies grid span style', () => {
      const cell: LayoutCell = { type: 'depth', span: 2 };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.display-cell').attributes('style')).toContain('grid-column: span 2');
    });
  });

  describe('Time Cell', () => {
    it('renders time in MM:SS format', () => {
      const cell: LayoutCell = { type: 'time', label: 'Temps' };
      const diveState = createMockDiveState({ currentTime: 15.5 }); // 15 min 30 sec
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('15:30');
    });

    it('pads minutes with leading zero', () => {
      const cell: LayoutCell = { type: 'time', label: 'Temps' };
      const diveState = createMockDiveState({ currentTime: 5.25 }); // 5 min 15 sec
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('05:15');
    });

    it('pads seconds with leading zero', () => {
      const cell: LayoutCell = { type: 'time', label: 'Temps' };
      const diveState = createMockDiveState({ currentTime: 10.083 }); // 10 min 5 sec
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('10:04');
    });

    it('renders time label', () => {
      const cell: LayoutCell = { type: 'time', label: 'Durée' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-label').text()).toBe('Durée');
    });
  });

  describe('NDL Cell', () => {
    it('renders NDL value when positive', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL' };
      const diveState = createMockDiveState({ deco: { ...createMockDiveState().deco, ndl: 25 } });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('25');
      expect(wrapper.find('.lcd-unit').text()).toBe('min');
    });

    it('renders 99+ when NDL exceeds 99', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL' };
      const diveState = createMockDiveState({ deco: { ...createMockDiveState().deco, ndl: 150 } });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('99+');
    });

    it('renders DECO when NDL is negative', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL', labelDeco: 'Palier' };
      const diveState = createMockDiveState({
        deco: { ...createMockDiveState().deco, ndl: -1, ceiling: 6 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('DECO');
      expect(wrapper.find('.lcd-unit').text()).toBe('m');
    });

    it('uses labelDeco when in deco', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL', labelDeco: 'Palier' };
      const diveState = createMockDiveState({ deco: { ...createMockDiveState().deco, ndl: -1 } });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-label').text()).toBe('Palier');
    });

    it('applies warning class when NDL <= 5', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL' };
      const diveState = createMockDiveState({ deco: { ...createMockDiveState().deco, ndl: 3 } });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('warning');
    });

    it('applies critical class when in deco', () => {
      const cell: LayoutCell = { type: 'ndl', label: 'NDL' };
      const diveState = createMockDiveState({ deco: { ...createMockDiveState().deco, ndl: -1 } });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('critical');
    });
  });

  describe('Air Cell', () => {
    it('renders tank pressure', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('150');
      expect(wrapper.find('.lcd-unit').text()).toBe('bar');
    });

    it('shows gauge when showGauge is true', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression', showGauge: true };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.air-gauge').exists()).toBe(true);
      expect(wrapper.find('.air-gauge-bar').exists()).toBe(true);
    });

    it('hides gauge when showGauge is false', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression', showGauge: false };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.air-gauge').exists()).toBe(false);
    });

    it('applies gauge-full class when pressure > 50%', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression' };
      const diveState = createMockDiveState({
        air: { ...createMockDiveState().air, tankPressure: 150, initialTankPressure: 200 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('gauge-full');
    });

    it('applies gauge-mid class when pressure 34-50%', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression' };
      const diveState = createMockDiveState({
        air: { ...createMockDiveState().air, tankPressure: 80, initialTankPressure: 200 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('gauge-mid');
    });

    it('applies gauge-low class when pressure 21-33%', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression' };
      const diveState = createMockDiveState({
        air: { ...createMockDiveState().air, tankPressure: 50, initialTankPressure: 200 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('gauge-low');
    });

    it('applies gauge-critical class when pressure <= 20%', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression' };
      const diveState = createMockDiveState({
        air: { ...createMockDiveState().air, tankPressure: 30, initialTankPressure: 200 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('gauge-critical');
    });

    it('sets gauge fill width based on air percentage', () => {
      const cell: LayoutCell = { type: 'air', label: 'Pression', showGauge: true };
      const diveState = createMockDiveState({
        air: { ...createMockDiveState().air, tankPressure: 150, initialTankPressure: 200 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      const fill = wrapper.find('.air-gauge-fill');
      expect(fill.attributes('style')).toContain('width: 75%');
    });
  });

  describe('Autonomy Cell', () => {
    it('renders remaining air time', () => {
      const cell: LayoutCell = { type: 'autonomy', label: 'Autonomie' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('35');
      expect(wrapper.find('.lcd-unit').text()).toBe('min');
    });
  });

  describe('TTS Cell', () => {
    it('renders time to surface', () => {
      const cell: LayoutCell = { type: 'tts', label: 'TTS' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('5');
      expect(wrapper.find('.lcd-unit').text()).toBe('min');
    });
  });

  describe('Ceiling Cell', () => {
    it('renders ceiling depth', () => {
      const cell: LayoutCell = { type: 'ceiling', label: 'Plafond' };
      const diveState = createMockDiveState({
        deco: { ...createMockDiveState().deco, ceiling: 6 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('6');
      expect(wrapper.find('.lcd-unit').text()).toBe('m');
    });

    it('applies warning class to ceiling value', () => {
      const cell: LayoutCell = { type: 'ceiling', label: 'Plafond' };
      const diveState = createMockDiveState({
        deco: { ...createMockDiveState().deco, ceiling: 6 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').classes()).toContain('warning');
    });
  });

  describe('Ascent Rate Cell', () => {
    it('renders ascent rate', () => {
      const cell: LayoutCell = { type: 'ascentRate', label: 'Vitesse' };
      const diveState = createMockDiveState({
        ascent: { rate: -8, isViolation: false, maxAllowedRate: 10 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('8');
      expect(wrapper.find('.lcd-unit').text()).toBe('m/min');
    });

    it('shows ascent bar indicator', () => {
      const cell: LayoutCell = { type: 'ascentRate', label: 'Vitesse' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.ascent-indicator').exists()).toBe(true);
      expect(wrapper.find('.ascent-bar').exists()).toBe(true);
    });

    it('applies violation class when ascending too fast', () => {
      const cell: LayoutCell = { type: 'ascentRate', label: 'Vitesse' };
      const diveState = createMockDiveState({
        ascent: { rate: -15, isViolation: true, maxAllowedRate: 10 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.ascent-bar-fill').classes()).toContain('violation');
      expect(wrapper.find('.lcd-value').classes()).toContain('critical');
    });

    it('applies descending class when going down', () => {
      const cell: LayoutCell = { type: 'ascentRate', label: 'Vitesse' };
      const diveState = createMockDiveState({
        ascent: { rate: 5, isViolation: false, maxAllowedRate: 10 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      expect(wrapper.find('.ascent-bar-fill').classes()).toContain('descending');
    });

    it('calculates bar height based on rate (max 100%)', () => {
      const cell: LayoutCell = { type: 'ascentRate', label: 'Vitesse' };
      const diveState = createMockDiveState({
        ascent: { rate: -7.5, isViolation: false, maxAllowedRate: 10 },
      });
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState },
      });

      // 7.5 / 15 * 100 = 50%
      const fill = wrapper.find('.ascent-bar-fill');
      expect(fill.attributes('style')).toContain('height: 50%');
    });
  });

  describe('SAC Rate Cell', () => {
    it('renders current SAC rate', () => {
      const cell: LayoutCell = { type: 'sac', label: 'Conso' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-value').text()).toBe('18');
      expect(wrapper.find('.lcd-unit').text()).toBe('L/min');
    });
  });

  describe('Default Labels', () => {
    it('uses default label when not provided', () => {
      const cell: LayoutCell = { type: 'depth' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.lcd-label').text()).toBe('Profondeur');
    });

    it('provides default labels for all cell types', () => {
      const cellTypes: Array<{ type: LayoutCell['type']; expectedLabel: string }> = [
        { type: 'depth', expectedLabel: 'Profondeur' },
        { type: 'time', expectedLabel: 'Temps' },
        { type: 'ndl', expectedLabel: 'NDL' },
        { type: 'air', expectedLabel: 'Pression' },
        { type: 'autonomy', expectedLabel: 'Autonomie' },
        { type: 'tts', expectedLabel: 'TTS' },
        { type: 'ceiling', expectedLabel: 'Plafond' },
        { type: 'ascentRate', expectedLabel: 'Vitesse' },
        { type: 'sac', expectedLabel: 'Conso' },
      ];

      for (const { type, expectedLabel } of cellTypes) {
        const cell: LayoutCell = { type };
        const wrapper = mount(DisplayCell, {
          props: { cell, diveState: createMockDiveState() },
        });

        expect(wrapper.find('.lcd-label').text()).toBe(expectedLabel);
      }
    });
  });

  describe('CSS Classes', () => {
    it('includes cell type as class', () => {
      const cell: LayoutCell = { type: 'depth' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.display-cell').classes()).toContain('depth');
    });

    it('always has display-cell class', () => {
      const cell: LayoutCell = { type: 'time' };
      const wrapper = mount(DisplayCell, {
        props: { cell, diveState: createMockDiveState() },
      });

      expect(wrapper.find('.display-cell').classes()).toContain('display-cell');
    });
  });
});
