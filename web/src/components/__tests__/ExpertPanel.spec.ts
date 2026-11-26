import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExpertPanel from '../ExpertPanel.vue';
import { createDecoDiveState, createMockDiveState } from './fixtures';

describe('ExpertPanel', () => {
  it('shows the algorithm and gradient factors', () => {
    const wrapper = mount(ExpertPanel, { props: { diveState: createMockDiveState() } });
    expect(wrapper.find('.expert-algo').text()).toBe('Bühlmann ZHL-16C · GF 30/85');
  });

  it('shows TTS, ascent rate and SAC outside deco', () => {
    const wrapper = mount(ExpertPanel, { props: { diveState: createMockDiveState() } });
    const types = wrapper.findAll('.display-cell').map((c) => c.classes()[1]);
    expect(types).toEqual(['tts', 'ascentRate', 'sac']);
  });

  it('adds the ceiling and mandatory stops in deco', () => {
    const wrapper = mount(ExpertPanel, { props: { diveState: createDecoDiveState() } });
    expect(wrapper.find('.display-cell.ceiling').exists()).toBe(true);
    expect(wrapper.findAll('.deco-stop')).toHaveLength(2);
  });
});
