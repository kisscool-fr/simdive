import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AirGauge from '../AirGauge.vue';

describe('AirGauge', () => {
  it('renders with default max pressure of 200', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').exists()).toBe(true);
    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-full');
  });

  it('calculates correct percentage based on pressure', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 100,
        maxPressure: 200,
      },
    });

    const fillElement = wrapper.find('.air-gauge-fill');
    expect(fillElement.attributes('style')).toContain('width: 50%');
  });

  it('applies gauge-full class when pressure is above 50%', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 150,
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-full');
  });

  it('applies gauge-mid class when pressure is between 33% and 50%', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 80,
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-mid');
  });

  it('applies gauge-low class when pressure is between 20% and 33%', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 50,
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-low');
  });

  it('applies gauge-critical class when pressure is at or below 20%', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 30,
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-critical');
  });

  it('generates correct markers based on max pressure', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 100,
        maxPressure: 200,
      },
    });

    const markers = wrapper.findAll('.air-gauge-marker');
    // Markers at 0, 50, 100, 150, 200
    expect(markers.length).toBe(5);
    expect(markers[0].text()).toBe('0');
    expect(markers[4].text()).toBe('200');
  });

  it('clamps percentage between 0 and 100', () => {
    const wrapperOver = mount(AirGauge, {
      props: {
        pressure: 300,
        maxPressure: 200,
      },
    });

    expect(wrapperOver.find('.air-gauge-fill').attributes('style')).toContain('width: 100%');

    const wrapperUnder = mount(AirGauge, {
      props: {
        pressure: -50,
        maxPressure: 200,
      },
    });

    expect(wrapperUnder.find('.air-gauge-fill').attributes('style')).toContain('width: 0%');
  });

  it('uses custom maxPressure when provided', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 75,
        maxPressure: 150,
      },
    });

    // 75/150 = 50%
    expect(wrapper.find('.air-gauge-fill').attributes('style')).toContain('width: 50%');
  });

  // Boundary tests
  it('applies gauge-critical at exactly 20% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 40, // 40/200 = 20%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-critical');
  });

  it('applies gauge-low just above 20% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 42, // 42/200 = 21%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-low');
  });

  it('applies gauge-low at exactly 33% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 66, // 66/200 = 33%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-low');
  });

  it('applies gauge-mid just above 33% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 68, // 68/200 = 34%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-mid');
  });

  it('applies gauge-mid at exactly 50% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 100, // 100/200 = 50%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-mid');
  });

  it('applies gauge-full just above 50% threshold', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 102, // 102/200 = 51%
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-full');
  });

  // Gauge marker lines
  it('renders gauge marker lines at correct positions', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 100,
        maxPressure: 200,
      },
    });

    const markerLines = wrapper.findAll('.gauge-marker');
    // Markers at 0, 50, 100, 150, 200 = 5 markers
    expect(markerLines.length).toBe(5);

    // Check positions: 0%, 25%, 50%, 75%, 100%
    expect(markerLines[0].attributes('style')).toContain('left: 0%');
    expect(markerLines[1].attributes('style')).toContain('left: 25%');
    expect(markerLines[2].attributes('style')).toContain('left: 50%');
    expect(markerLines[3].attributes('style')).toContain('left: 75%');
    expect(markerLines[4].attributes('style')).toContain('left: 100%');
  });

  // Edge cases
  it('handles zero pressure correctly', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 0,
        maxPressure: 200,
      },
    });

    expect(wrapper.find('.air-gauge-fill').attributes('style')).toContain('width: 0%');
    expect(wrapper.find('.air-gauge-fill').classes()).toContain('gauge-critical');
  });

  it('generates correct markers with non-standard maxPressure', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 150,
        maxPressure: 300,
      },
    });

    const markers = wrapper.findAll('.air-gauge-marker');
    // Markers at 0, 50, 100, 150, 200, 250, 300 = 7 markers
    expect(markers.length).toBe(7);
    expect(markers[0].text()).toBe('0');
    expect(markers[6].text()).toBe('300');

    // Check marker positions
    const markerLines = wrapper.findAll('.gauge-marker');
    expect(markerLines.length).toBe(7);
  });

  it('verifies marker label positions match marker line positions', () => {
    const wrapper = mount(AirGauge, {
      props: {
        pressure: 100,
        maxPressure: 200,
      },
    });

    const markerLabels = wrapper.findAll('.air-gauge-marker');
    // Check positions match: 0%, 25%, 50%, 75%, 100%
    expect(markerLabels[0].attributes('style')).toContain('left: 0%');
    expect(markerLabels[2].attributes('style')).toContain('left: 50%');
    expect(markerLabels[4].attributes('style')).toContain('left: 100%');
  });
});
