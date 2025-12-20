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
});
