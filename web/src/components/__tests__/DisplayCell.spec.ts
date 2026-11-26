import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DisplayCell from '../DisplayCell.vue';
import type { DiveState } from '../../types/dive';
import type { ScreenWidget } from '../../types/computer';
import { createDecoDiveState, createMockDiveState } from './fixtures';

function mountWidget(widget: Partial<ScreenWidget>, diveState: DiveState = createMockDiveState()) {
  return mount(DisplayCell, {
    props: { widget: { area: 'a', type: 'depth', ...widget } as ScreenWidget, diveState },
  });
}

describe('DisplayCell', () => {
  describe('value widgets', () => {
    it.each([
      ['depth', '25.3', 'm', 'Profondeur'],
      ['maxDepth', '28.7', 'm', 'Prof. max'],
      ['time', '15:30', null, 'Temps'],
      ['ndl', '12', 'min', 'NDL'],
      ['air', '150', 'bar', 'Pression'],
      ['autonomy', '35', 'min', 'Autonomie'],
      ['tts', '5', 'min', 'TTS'],
      ['ascentRate', '2', 'm/min', 'Vitesse'],
      ['sac', '18', 'L/min', 'Conso'],
    ] as const)('renders %s value, unit and default label', (type, value, unit, label) => {
      const wrapper = mountWidget({ type });

      expect(wrapper.find('.lcd-value').text()).toBe(value);
      expect(wrapper.find('.lcd-label').text()).toBe(label);
      if (unit) expect(wrapper.find('.lcd-unit').text()).toBe(unit);
      else expect(wrapper.find('.lcd-unit').exists()).toBe(false);
    });

    it('uses the label override', () => {
      expect(mountWidget({ type: 'depth', label: 'Prof.' }).find('.lcd-label').text()).toBe(
        'Prof.'
      );
    });

    it('applies type, size and highlight classes', () => {
      const cell = mountWidget({ type: 'depth', size: 'xl', highlight: true }).find(
        '.display-cell'
      );
      expect(cell.classes()).toEqual(
        expect.arrayContaining(['display-cell', 'depth', 'size-xl', 'highlight'])
      );
    });

    it('defaults to medium size', () => {
      expect(mountWidget({ type: 'time' }).find('.display-cell').classes()).toContain('size-md');
    });

    it('shows max depth below depth only when showMax is set', () => {
      expect(mountWidget({ type: 'depth' }).find('.lcd-sublabel').exists()).toBe(false);
      expect(mountWidget({ type: 'depth', showMax: true }).find('.lcd-sublabel').text()).toBe(
        'Max: 28.7m'
      );
    });
  });

  describe('ndl', () => {
    it('shows 99+ above 99 minutes', () => {
      const state = createMockDiveState();
      state.deco.ndl = 150;
      expect(mountWidget({ type: 'ndl' }, state).find('.lcd-value').text()).toBe('99+');
    });

    it('flags 5 minutes or less as a warning', () => {
      const state = createMockDiveState();
      state.deco.ndl = 5;
      expect(mountWidget({ type: 'ndl' }, state).find('.lcd-value').classes()).toContain('warning');
    });

    it('shows DECO with the deco label and no unit when in deco', () => {
      const wrapper = mountWidget({ type: 'ndl' }, createDecoDiveState());
      expect(wrapper.find('.lcd-value').text()).toBe('DECO');
      expect(wrapper.find('.lcd-value').classes()).toContain('critical');
      expect(wrapper.find('.lcd-label').text()).toBe('Palier');
      expect(wrapper.find('.lcd-unit').exists()).toBe(false);
    });

    it('uses labelDeco when in deco', () => {
      const wrapper = mountWidget({ type: 'ndl', labelDeco: 'DÉCO' }, createDecoDiveState());
      expect(wrapper.find('.lcd-label').text()).toBe('DÉCO');
    });
  });

  describe('air', () => {
    it.each([
      [150, 'gauge-full'],
      [100, 'gauge-mid'],
      [60, 'gauge-low'],
      [40, 'gauge-critical'],
    ])('at %i bar uses %s', (pressure, gaugeClass) => {
      const state = createMockDiveState();
      state.air.tankPressure = pressure;
      expect(mountWidget({ type: 'air' }, state).find('.lcd-value').classes()).toContain(
        gaugeClass
      );
    });

    it('shows a gauge filled to the remaining percentage when showGauge is set', () => {
      expect(mountWidget({ type: 'air' }).find('.air-gauge').exists()).toBe(false);
      const fill = mountWidget({ type: 'air', showGauge: true }).find('.air-gauge-fill');
      expect(fill.attributes('style')).toContain('width: 75%');
    });
  });

  describe('ascent rate', () => {
    it('flags an ascent rate violation', () => {
      const state = createMockDiveState();
      state.ascent = { rate: -15, isViolation: true, maxAllowedRate: 10 };
      const wrapper = mountWidget({ type: 'ascentRate' }, state);
      expect(wrapper.find('.lcd-value').classes()).toContain('critical');
      expect(wrapper.find('.ascent-bar-fill').classes()).toContain('violation');
      expect(wrapper.find('.ascent-bar-fill').attributes('style')).toContain('height: 100%');
    });

    it('marks descent', () => {
      const state = createMockDiveState();
      state.ascent.rate = 6;
      const fill = mountWidget({ type: 'ascentRate' }, state).find('.ascent-bar-fill');
      expect(fill.classes()).toContain('descending');
    });
  });

  describe('conditional widgets', () => {
    it.each(['ceiling', 'safetyStop', 'decoStops', 'warnings'] as const)(
      'renders nothing for %s when there is nothing to show',
      (type) => {
        expect(mountWidget({ type }).html()).toBe('<!--v-if-->');
      }
    );

    it('shows the ceiling when in deco', () => {
      const wrapper = mountWidget({ type: 'ceiling' }, createDecoDiveState());
      expect(wrapper.find('.lcd-value').text()).toBe('3');
      expect(wrapper.find('.lcd-unit').text()).toBe('m');
    });

    it('lists mandatory deco stops', () => {
      const stops = mountWidget({ type: 'decoStops' }, createDecoDiveState()).findAll('.deco-stop');
      expect(stops.map((s) => s.text())).toEqual(['6m2min', '3m8min']);
    });

    it('shows the safety stop countdown', () => {
      const state = createMockDiveState();
      state.safetyStop = { required: true, active: true, depth: 5, duration: 180, remaining: 125 };
      const wrapper = mountWidget({ type: 'safetyStop' }, state);
      expect(wrapper.find('.safety-stop').classes()).toContain('active');
      expect(wrapper.find('.lcd-value').text()).toBe('2:05');
      expect(wrapper.find('.lcd-unit').text()).toBe('à 5m');
    });

    it('lists active warnings with their level', () => {
      const state = createMockDiveState({
        activeWarnings: [
          { type: 'critical', message: 'Remontée trop rapide', code: 'ASCENT' },
          { type: 'info', message: 'Palier conseillé', code: 'STOP' },
        ],
      });
      const items = mountWidget({ type: 'warnings' }, state).findAll('.warning-item');
      expect(items).toHaveLength(2);
      expect(items[0].find('.warning-text').classes()).toContain('critical');
      expect(items[0].text()).toContain('Remontée trop rapide');
    });
  });
});
