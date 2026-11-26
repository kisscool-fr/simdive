import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ComputerModelSelector from '../ComputerModelSelector.vue';
import { DEFAULT_COMPUTER_MODEL } from '../../composables/useComputerModels';
import type { ComputerModel } from '../../types/computer';
import wideWrist from '../../../public/data/computers/wide-wrist.json';

const models = [DEFAULT_COMPUTER_MODEL, wideWrist as ComputerModel];

describe('ComputerModelSelector', () => {
  it('lists every model', () => {
    const wrapper = mount(ComputerModelSelector, { props: { modelValue: 'simdive', models } });
    expect(wrapper.findAll('option').map((o) => o.text())).toEqual([
      'SimDive',
      'Poignet écran large',
    ]);
  });

  it('shows the selected model description and the calculation note', () => {
    const wrapper = mount(ComputerModelSelector, { props: { modelValue: 'wide-wrist', models } });
    expect(wrapper.find('.model-description').text()).toContain('LCD segmenté');
    expect(wrapper.find('.model-note').text()).toContain('Bühlmann ZHL-16C');
  });

  it('emits the selected model id', async () => {
    const wrapper = mount(ComputerModelSelector, { props: { modelValue: 'simdive', models } });
    await wrapper.find('select').setValue('wide-wrist');
    expect(wrapper.emitted('update:modelValue')).toEqual([['wide-wrist']]);
  });

  it('lists loading errors', () => {
    const wrapper = mount(ComputerModelSelector, {
      props: { modelValue: 'simdive', models, errors: ['Modèle "x" : "id" manquant'] },
    });
    expect(wrapper.find('.model-errors').text()).toContain('Modèle "x"');
  });

  it('disables the select while loading', () => {
    const wrapper = mount(ComputerModelSelector, {
      props: { modelValue: 'simdive', models, loading: true },
    });
    expect(wrapper.find('select').attributes('disabled')).toBeDefined();
  });
});
