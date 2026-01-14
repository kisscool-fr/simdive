import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProfileSelector from '../ProfileSelector.vue';
import type { DiveProfile } from '../../types/dive';

// Mock profile data
const mockProfiles: DiveProfile[] = [
  {
    id: 'profile-1',
    name: 'Plongée Simple',
    description: 'Une plongée simple à 20m',
    tankVolume: 12,
    initialTankPressure: 200,
    sacRate: 20,
    waypoints: [
      { time: 0, depth: 0 },
      { time: 5, depth: 20 },
      { time: 25, depth: 20 },
      { time: 30, depth: 0 },
    ],
    events: [],
  },
  {
    id: 'profile-2',
    name: 'Plongée Profonde',
    description: 'Une plongée profonde à 40m',
    tankVolume: 15,
    initialTankPressure: 230,
    sacRate: 22,
    waypoints: [
      { time: 0, depth: 0 },
      { time: 10, depth: 40 },
      { time: 35, depth: 40 },
      { time: 45, depth: 0 },
    ],
    events: [],
  },
];

const mockProfilesResponse = {
  profiles: mockProfiles,
};

describe('ProfileSelector', () => {
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

  // Helper to create a successful fetch mock
  function mockFetchSuccess(data: unknown = mockProfilesResponse) {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response);
  }

  // Helper to create a failed fetch mock
  function mockFetchError() {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);
  }

  it('shows loading state initially', () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toContain('Chargement des profils');
  });

  it('loads and displays profiles from JSON', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.profile-select').exists()).toBe(true);

    const options = wrapper.findAll('option');
    // 1 disabled placeholder + 2 profiles
    expect(options.length).toBe(3);
    expect(options[1].text()).toBe('Plongée Simple');
    expect(options[2].text()).toBe('Plongée Profonde');
  });

  it('selects first profile by default after loading', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    const select = wrapper.find('.profile-select');
    expect((select.element as HTMLSelectElement).value).toBe('profile-1');
  });

  it('emits update:modelValue and load events when profile is loaded', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('load')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([mockProfiles[0]]);
    expect(wrapper.emitted('load')![0]).toEqual([mockProfiles[0]]);
  });

  it('displays profile description when profile is selected', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.profile-description').exists()).toBe(true);
    expect(wrapper.find('.profile-description p').text()).toBe('Une plongée simple à 20m');
  });

  it('displays profile details (tank, consumption, duration)', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    const details = wrapper.findAll('.detail');
    expect(details.length).toBe(3);

    // Tank info: 12L @ 200bar
    expect(details[0].text()).toContain('12L');
    expect(details[0].text()).toContain('200bar');

    // Consumption: 20L/min
    expect(details[1].text()).toContain('20L/min');

    // Duration: 30min (last waypoint time)
    expect(details[2].text()).toContain('30min');
  });

  it('emits events when user changes profile selection', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    // Change to second profile
    const select = wrapper.find('.profile-select');
    await select.setValue('profile-2');

    // Should have emitted twice: once on load, once on change
    expect(wrapper.emitted('update:modelValue')!.length).toBe(2);
    expect(wrapper.emitted('load')!.length).toBe(2);
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([mockProfiles[1]]);
    expect(wrapper.emitted('load')![1]).toEqual([mockProfiles[1]]);
  });

  it('updates displayed details when profile changes', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    // Change to second profile
    const select = wrapper.find('.profile-select');
    await select.setValue('profile-2');

    await flushPromises();

    // Check updated description
    expect(wrapper.find('.profile-description p').text()).toBe('Une plongée profonde à 40m');

    // Check updated details
    const details = wrapper.findAll('.detail');
    expect(details[0].text()).toContain('15L');
    expect(details[0].text()).toContain('230bar');
    expect(details[1].text()).toContain('22L/min');
    expect(details[2].text()).toContain('45min');
  });

  it('shows error state when fetch fails', async () => {
    mockFetchError();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toContain('Erreur de chargement des profils');
  });

  it('shows retry button when error occurs', async () => {
    mockFetchError();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.retry-btn').exists()).toBe(true);
    expect(wrapper.find('.retry-btn').text()).toBe('Réessayer');
  });

  it('retries loading when retry button is clicked', async () => {
    // First call fails
    mockFetchError();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);

    // Second call succeeds
    mockFetchSuccess();
    await wrapper.find('.retry-btn').trigger('click');

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(false);
    expect(wrapper.find('.profile-select').exists()).toBe(true);
  });

  it('syncs with external modelValue prop changes', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector, {
      props: {
        modelValue: null,
      },
    });

    await flushPromises();

    // Update modelValue prop to second profile
    await wrapper.setProps({ modelValue: mockProfiles[1] });

    await flushPromises();

    const select = wrapper.find('.profile-select');
    expect((select.element as HTMLSelectElement).value).toBe('profile-2');
  });

  it('renders profile label correctly', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    expect(wrapper.find('.profile-label').exists()).toBe(true);
    expect(wrapper.find('.profile-label').text()).toBe('Profil de plongée');
  });

  it('has disabled placeholder option in select', async () => {
    mockFetchSuccess();
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    const placeholderOption = wrapper.find('option[disabled]');
    expect(placeholderOption.exists()).toBe(true);
    expect(placeholderOption.text()).toBe('Sélectionnez un profil');
  });

  it('handles network error gracefully', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toContain('Network error');
  });

  it('handles empty profiles array', async () => {
    mockFetchSuccess({ profiles: [] });
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.find('.profile-select').exists()).toBe(true);
    const options = wrapper.findAll('option');
    // Only the disabled placeholder
    expect(options.length).toBe(1);
    expect(wrapper.find('.profile-description').exists()).toBe(false);
  });

  it('does not emit events if no profiles are available', async () => {
    mockFetchSuccess({ profiles: [] });
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    expect(wrapper.emitted('load')).toBeFalsy();
  });

  it('calculates duration from last waypoint time', async () => {
    const profileWithLongDive: DiveProfile[] = [
      {
        ...mockProfiles[0],
        waypoints: [
          { time: 0, depth: 0 },
          { time: 60, depth: 30 },
          { time: 90, depth: 0 },
        ],
      },
    ];
    mockFetchSuccess({ profiles: profileWithLongDive });
    const wrapper = mount(ProfileSelector);

    await flushPromises();

    const durationDetail = wrapper.findAll('.detail')[2];
    expect(durationDetail.text()).toContain('90min');
  });
});
