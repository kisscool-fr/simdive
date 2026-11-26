import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DiveComputerDisplay from '../DiveComputerDisplay.vue';
import { DEFAULT_COMPUTER_MODEL } from '../../composables/useComputerModels';
import type { ComputerModel } from '../../types/computer';
import roundWatch from '../../../public/data/computers/round-watch.json';
import { createMockDiveState } from './fixtures';

const twoScreenModel: ComputerModel = {
  id: 'two-screens',
  name: 'Deux écrans',
  description: '',
  formFactor: { shape: 'rect', aspectRatio: '4 / 3', display: 'segment-lcd', cellStyle: 'flat' },
  screens: [
    {
      id: 'main',
      name: 'Principal',
      columns: '3fr 2fr',
      areas: ['depth ndl', 'depth time'],
      widgets: [
        { area: 'depth', type: 'depth' },
        { area: 'ndl', type: 'ndl' },
        { area: 'time', type: 'time' },
      ],
    },
    {
      id: 'info',
      name: 'Informations',
      areas: ['max'],
      widgets: [{ area: 'max', type: 'maxDepth' }],
    },
  ],
  theme: { lcdText: '#111111', bgLcd: '#b8c2a4' },
};

function mountDisplay(model?: ComputerModel | null, diveState = createMockDiveState()) {
  return mount(DiveComputerDisplay, { props: { diveState, model } });
}

describe('DiveComputerDisplay', () => {
  it('uses the built-in SimDive model when none is given', () => {
    const wrapper = mountDisplay(null);
    expect(wrapper.attributes('data-model')).toBe('simdive');
    expect(wrapper.find('.dive-computer-title').text()).toBe('SimDive');
    expect(wrapper.findAll('.display-cell')).toHaveLength(5);
  });

  it('shows a placeholder without a dive state', () => {
    const wrapper = mount(DiveComputerDisplay, { props: { diveState: null } });
    expect(wrapper.find('.no-data').text()).toContain('Sélectionnez un profil');
    expect(wrapper.find('.screen-grid').exists()).toBe(false);
  });

  it('places each widget in its named grid area', () => {
    const wrapper = mountDisplay(twoScreenModel);
    const grid = wrapper.find('.screen-grid');

    expect(grid.attributes('style')).toContain('grid-template-areas: "depth ndl" "depth time"');
    expect(grid.attributes('style')).toContain('grid-template-columns: 3fr 2fr');
    expect(wrapper.findAll('.screen-area').map((a) => a.attributes('style'))).toEqual([
      'grid-area: depth;',
      'grid-area: ndl;',
      'grid-area: time;',
    ]);
  });

  it('applies shape, display and cell style classes', () => {
    const wrapper = mountDisplay(twoScreenModel);
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['dive-computer', 'shape-rect', 'display-segment-lcd'])
    );
    expect(wrapper.find('.screen-grid').classes()).toContain('cells-flat');
    expect(wrapper.find('.screen').attributes('style')).toContain('aspect-ratio: 4 / 3');
  });

  it('renders a round model', () => {
    const wrapper = mountDisplay(roundWatch as ComputerModel);
    expect(wrapper.classes()).toContain('shape-round');
    expect(wrapper.find('.screen').attributes('style')).toBeUndefined();
  });

  it('scopes theme colours to the computer element', () => {
    const wrapper = mountDisplay(twoScreenModel);
    const style = wrapper.attributes('style');

    expect(style).toContain('--dc-lcd-text: #111111');
    expect(style).toContain('--dc-bg-lcd: #b8c2a4');
    expect(document.documentElement.style.getPropertyValue('--dc-lcd-text')).toBe('');
  });

  describe('screens', () => {
    it('hides the screen controls for a single-screen model', () => {
      const wrapper = mountDisplay(DEFAULT_COMPUTER_MODEL);
      expect(wrapper.find('.hw-button').exists()).toBe(false);
    });

    it('cycles through screens with the button and wraps around', async () => {
      const wrapper = mountDisplay(twoScreenModel);
      const button = wrapper.find('button[aria-label="Écran suivant"]');

      expect(wrapper.find('.screen-grid').attributes('data-screen')).toBe('main');
      expect(wrapper.find('.screen-name').text()).toBe('Principal');

      await button.trigger('click');
      expect(wrapper.find('.screen-grid').attributes('data-screen')).toBe('info');
      expect(wrapper.find('.screen-name').text()).toBe('Informations');
      expect(wrapper.find('.display-cell').classes()).toContain('maxDepth');
      expect(wrapper.findAll('.screen-dot')[1].classes()).toContain('active');

      await button.trigger('click');
      expect(wrapper.find('.screen-grid').attributes('data-screen')).toBe('main');
    });

    it('returns to the first screen when the model changes', async () => {
      const wrapper = mountDisplay(twoScreenModel);
      await wrapper.find('.hw-button').trigger('click');

      await wrapper.setProps({ model: roundWatch as ComputerModel });

      expect(wrapper.find('.screen-grid').attributes('data-screen')).toBe('main');
      expect(wrapper.findAll('.screen-dot')).toHaveLength(3);
    });
  });

  it('renders the mode-toggle slot in the header', () => {
    const wrapper = mount(DiveComputerDisplay, {
      props: { diveState: createMockDiveState() },
      slots: { 'mode-toggle': '<div class="toggle-stub" />' },
    });
    expect(wrapper.find('.dive-computer-header .toggle-stub').exists()).toBe(true);
  });
});
