import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LayoutSelector from '../LayoutSelector.vue';
import type { LayoutConfig, LayoutsIndex } from '../../types/dive';

// Mock layout data
const mockLayoutIndex: LayoutsIndex = {
  layouts: [
    { id: 'default', name: 'SimDive Default', path: 'default' },
    { id: 'compact', name: 'Compact View', path: 'compact' },
  ],
};

const mockDefaultLayout: LayoutConfig = {
  id: 'default',
  name: 'SimDive Default',
  description: 'Layout par défaut avec affichage complet',
  grid: { columns: 2, gap: '16px' },
  header: { title: 'SimDive', showModeToggle: true },
  cells: [
    { type: 'depth', span: 2, primary: true, showMax: true, label: 'Profondeur' },
    { type: 'time', label: 'Temps' },
    { type: 'ndl', label: 'NDL', labelDeco: 'Palier' },
    { type: 'air', showGauge: true, label: 'Pression' },
    { type: 'autonomy', label: 'Autonomie' },
    { type: 'tts', mode: 'expert', label: 'TTS' },
  ],
  sections: { safetyStop: true, decoStops: 'expert', warnings: true },
  theme: { lcdText: '#00ff88', accentCyan: '#00d4ff' },
};

const mockCompactLayout: LayoutConfig = {
  id: 'compact',
  name: 'Compact View',
  description: 'Affichage compact pour petits écrans',
  grid: { columns: 1, gap: '8px' },
  header: { title: 'SimDive', showModeToggle: false },
  cells: [
    { type: 'depth', primary: true, label: 'Prof.' },
    { type: 'time', label: 'Temps' },
    { type: 'air', label: 'Air' },
  ],
  sections: { safetyStop: true, decoStops: false, warnings: true },
  theme: {},
};

describe('LayoutSelector', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock global fetch
    fetchSpy = vi.spyOn(global, 'fetch');
    // Suppress console.error during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to mock fetch calls for layout loading
  function mockLayoutsFetch(
    indexData: LayoutsIndex = mockLayoutIndex,
    configData: LayoutConfig = mockDefaultLayout
  ) {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(indexData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(configData),
      } as Response);
  }

  function mockFetchError(step: 'index' | 'config' = 'index') {
    if (step === 'index') {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
    } else {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLayoutIndex),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);
    }
  }

  it('shows loading state initially', () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toContain('Chargement des layouts');
  });

  it('loads and displays layouts from JSON', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.layout-select').exists()).toBe(true);

    const options = wrapper.findAll('option');
    // 1 disabled placeholder + 2 layouts
    expect(options.length).toBe(3);
    expect(options[1].text()).toBe('SimDive Default');
    expect(options[2].text()).toBe('Compact View');
  });

  it('fetches layouts index from correct URL', async () => {
    mockLayoutsFetch();
    mount(LayoutSelector);

    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith('/data/layouts/layouts.json');
  });

  it('fetches layout config from correct URL', async () => {
    mockLayoutsFetch();
    mount(LayoutSelector);

    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith('/data/layouts/default/config.json');
  });

  it('selects default layout after loading', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    const select = wrapper.find('.layout-select');
    expect((select.element as HTMLSelectElement).value).toBe('default');
  });

  it('emits update:modelValue and change events when layout is loaded', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([mockDefaultLayout]);
    expect(wrapper.emitted('change')![0]).toEqual([mockDefaultLayout]);
  });

  it('displays layout description when layout is selected', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.layout-description').exists()).toBe(true);
    expect(wrapper.find('.layout-description p').text()).toBe(
      'Layout par défaut avec affichage complet'
    );
  });

  it('displays layout details (cells count, grid columns)', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    const details = wrapper.findAll('.detail');
    expect(details.length).toBe(2);

    // Cells count
    expect(details[0].text()).toContain('6'); // 6 cells in mockDefaultLayout

    // Grid columns
    expect(details[1].text()).toContain('2 colonnes');
  });

  it('emits events when user changes layout selection', async () => {
    // First fetch: index + default layout
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    // Setup fetch for compact layout
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCompactLayout),
    } as Response);

    // Change to compact layout
    const select = wrapper.find('.layout-select');
    await select.setValue('compact');

    await flushPromises();

    // Should have emitted twice: once on load, once on change
    expect(wrapper.emitted('update:modelValue')!.length).toBe(2);
    expect(wrapper.emitted('change')!.length).toBe(2);
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([mockCompactLayout]);
  });

  it('updates displayed details when layout changes', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    // Setup fetch for compact layout
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCompactLayout),
    } as Response);

    // Change to compact layout
    const select = wrapper.find('.layout-select');
    await select.setValue('compact');

    await flushPromises();

    // Check updated description
    expect(wrapper.find('.layout-description p').text()).toBe(
      'Affichage compact pour petits écrans'
    );

    // Check updated details
    const details = wrapper.findAll('.detail');
    expect(details[0].text()).toContain('3'); // 3 cells in compact
    expect(details[1].text()).toContain('1 colonne');
  });

  it('shows error state when index fetch fails', async () => {
    mockFetchError('index');
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toContain('Erreur de chargement');
  });

  it('shows error state when config fetch fails', async () => {
    mockFetchError('config');
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);
  });

  it('shows retry button when error occurs', async () => {
    mockFetchError('index');
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.retry-btn').exists()).toBe(true);
    expect(wrapper.find('.retry-btn').text()).toBe('Réessayer');
  });

  it('retries loading when retry button is clicked', async () => {
    // First call fails
    mockFetchError('index');
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);

    // Second call succeeds
    mockLayoutsFetch();
    await wrapper.find('.retry-btn').trigger('click');

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(false);
    expect(wrapper.find('.layout-select').exists()).toBe(true);
  });

  it('syncs with external modelValue prop changes', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector, {
      props: {
        modelValue: null,
      },
    });

    await flushPromises();

    // Update modelValue prop to compact layout
    await wrapper.setProps({ modelValue: mockCompactLayout });

    await flushPromises();

    const select = wrapper.find('.layout-select');
    expect((select.element as HTMLSelectElement).value).toBe('compact');
  });

  it('renders layout label correctly', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    expect(wrapper.find('.layout-label').exists()).toBe(true);
    expect(wrapper.find('.layout-label').text()).toBe('Affichage ordinateur');
  });

  it('has disabled placeholder option in select', async () => {
    mockLayoutsFetch();
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    const placeholderOption = wrapper.find('option[disabled]');
    expect(placeholderOption.exists()).toBe(true);
    expect(placeholderOption.text()).toBe('Sélectionnez un affichage');
  });

  it('handles network error gracefully', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);
  });

  it('handles empty layouts array', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ layouts: [] }),
    } as Response);
    const wrapper = mount(LayoutSelector);

    await flushPromises();

    expect(wrapper.find('.layout-select').exists()).toBe(true);
    const options = wrapper.findAll('option');
    // Only the disabled placeholder
    expect(options.length).toBe(1);
    expect(wrapper.find('.layout-description').exists()).toBe(false);
  });

  it('loads first layout if default is not found', async () => {
    const indexWithoutDefault: LayoutsIndex = {
      layouts: [{ id: 'custom', name: 'Custom Layout', path: 'custom' }],
    };

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(indexWithoutDefault),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockDefaultLayout, id: 'custom' }),
      } as Response);

    mount(LayoutSelector);

    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith('/data/layouts/custom/config.json');
  });
});
