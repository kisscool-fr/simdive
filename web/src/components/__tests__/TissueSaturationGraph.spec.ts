import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TissueSaturationGraph from '../TissueSaturationGraph.vue';

describe('TissueSaturationGraph', () => {
  it('renders the component with header title', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(50),
      },
    });

    expect(wrapper.find('.tissue-graph').exists()).toBe(true);
    expect(wrapper.find('.tissue-graph-title').text()).toContain('Saturation des tissus');
  });

  it('displays legend with three saturation levels', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(50),
      },
    });

    const legendItems = wrapper.findAll('.legend-item');
    expect(legendItems.length).toBe(3);
    expect(legendItems[0].text()).toContain('<70%');
    expect(legendItems[1].text()).toContain('70-90%');
    expect(legendItems[2].text()).toContain('>90%');
  });

  it('renders bars for all tissue compartments', () => {
    const saturations = Array(16).fill(50);
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations,
      },
    });

    const bars = wrapper.findAll('.tissue-bar');
    expect(bars.length).toBe(16);
  });

  it('applies safe class when saturation is below 70%', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(60),
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');
    barFills.forEach((bar) => {
      expect(bar.classes()).toContain('safe');
    });
  });

  it('applies warning class when saturation is between 70% and 90%', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(80),
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');
    barFills.forEach((bar) => {
      expect(bar.classes()).toContain('warning');
    });
  });

  it('applies danger class when saturation is 90% or above', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(95),
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');
    barFills.forEach((bar) => {
      expect(bar.classes()).toContain('danger');
    });
  });

  it('sets bar height based on saturation percentage', () => {
    const saturations = [0, 25, 50, 75, 100];
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: [...saturations, ...Array(11).fill(50)],
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');

    // Check minimum height of 2% for 0 saturation
    expect(barFills[0].attributes('style')).toContain('height: 2%');

    // Check other heights
    expect(barFills[1].attributes('style')).toContain('height: 25%');
    expect(barFills[2].attributes('style')).toContain('height: 50%');
    expect(barFills[3].attributes('style')).toContain('height: 75%');
    expect(barFills[4].attributes('style')).toContain('height: 100%');
  });

  it('displays saturation percentage when saturation is 50% or higher', () => {
    const saturations = [40, 50, 75, 100];
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: [...saturations, ...Array(12).fill(30)],
      },
    });

    const barValues = wrapper.findAll('.bar-value');

    // Only bars with saturation >= 50 should display value
    expect(barValues.length).toBeGreaterThan(0);

    // Check specific values for compartments with saturation >= 50
    const barFills = wrapper.findAll('.tissue-bar-fill');
    expect(barFills[1].find('.bar-value').exists()).toBe(true); // 50%
    expect(barFills[2].find('.bar-value').exists()).toBe(true); // 75%
    expect(barFills[3].find('.bar-value').exists()).toBe(true); // 100%
  });

  it('does not display saturation percentage when saturation is below 50%', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(40),
      },
    });

    const barValues = wrapper.findAll('.bar-value');
    expect(barValues.length).toBe(0);
  });

  it('displays tissue labels from 1 to 16', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(50),
      },
    });

    const labels = wrapper.findAll('.tissue-label');
    expect(labels.length).toBe(16);

    labels.forEach((label, index) => {
      expect(label.text()).toBe(String(index + 1));
    });
  });

  it('displays M-value reference line', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(50),
      },
    });

    expect(wrapper.find('.m-value-marker').exists()).toBe(true);
    expect(wrapper.find('.m-value-label').text()).toContain('M-value');
    expect(wrapper.find('.m-value-line').exists()).toBe(true);
  });

  it('displays tissue info with half-time range', () => {
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations: Array(16).fill(50),
      },
    });

    const infoText = wrapper.find('.info-text').text();
    expect(infoText).toContain('Compartiments 1-16');
    expect(infoText).toContain('4');
    expect(infoText).toContain('635');
  });

  it('shows tooltip with tissue number, half-time and saturation on bar hover', () => {
    const saturations = Array(16).fill(75);
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations,
      },
    });

    const firstBar = wrapper.find('.tissue-bar');
    const title = firstBar.attributes('title');

    expect(title).toContain('T1');
    expect(title).toContain('4min');
    expect(title).toContain('75%');
  });

  it('handles different saturation values for each compartment', () => {
    const saturations = [10, 25, 40, 55, 70, 85, 92, 98, 95, 88, 75, 60, 45, 30, 15, 5];
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations,
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');

    // Check first bar (10%) - should be safe
    expect(barFills[0].classes()).toContain('safe');

    // Check middle bar (70%) - should be warning
    expect(barFills[4].classes()).toContain('warning');

    // Check high bar (98%) - should be danger
    expect(barFills[7].classes()).toContain('danger');
  });

  it('rounds saturation percentages in display', () => {
    const saturations = Array(16).fill(75.7);
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations,
      },
    });

    const barValues = wrapper.findAll('.bar-value');
    barValues.forEach((value) => {
      expect(value.text()).toBe('76');
    });
  });

  it('enforces minimum bar height of 2%', () => {
    const saturations = Array(16).fill(0);
    const wrapper = mount(TissueSaturationGraph, {
      props: {
        saturations,
      },
    });

    const barFills = wrapper.findAll('.tissue-bar-fill');
    barFills.forEach((bar) => {
      expect(bar.attributes('style')).toContain('height: 2%');
    });
  });
});
