import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLayout } from '../useLayout';
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
  description: 'Layout par défaut',
  grid: { columns: 2, gap: '16px' },
  header: { title: 'SimDive', showModeToggle: true },
  cells: [{ type: 'depth', span: 2, primary: true }, { type: 'time' }],
  sections: { safetyStop: true, decoStops: 'expert', warnings: true },
  theme: { lcdText: '#00ff88', accentCyan: '#00d4ff' },
};

const mockCompactLayout: LayoutConfig = {
  id: 'compact',
  name: 'Compact View',
  description: 'Affichage compact',
  grid: { columns: 1, gap: '8px' },
  header: { title: 'SimDive', showModeToggle: false },
  cells: [{ type: 'depth' }, { type: 'time' }],
  sections: { safetyStop: true, decoStops: false, warnings: true },
  theme: { lcdText: '#ffffff' },
};

describe('useLayout', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchResponses(
    indexData: LayoutsIndex | null = mockLayoutIndex,
    configData: LayoutConfig | null = mockDefaultLayout
  ) {
    if (indexData !== null) {
      // Mock successful index fetch
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(indexData),
      } as Response);

      // Only mock config fetch if index succeeds (since config is only fetched after index)
      if (configData !== null) {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(configData),
        } as Response);
      } else {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);
      }
    } else {
      // Mock failed index fetch - don't mock config since it won't be fetched
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
    }
  }

  describe('loadLayoutsIndex', () => {
    it('loads layouts index successfully', async () => {
      mockFetchResponses();
      const layout = useLayout();

      await layout.loadLayoutsIndex();

      expect(layout.layouts.value).toHaveLength(2);
      expect(layout.layouts.value[0].id).toBe('default');
      expect(layout.layouts.value[1].id).toBe('compact');
    });

    it('sets loading state during fetch', async () => {
      mockFetchResponses();
      const layout = useLayout();

      const loadPromise = layout.loadLayoutsIndex();

      // Should be loading initially
      expect(layout.loading.value).toBe(true);

      await loadPromise;

      // Should not be loading after completion
      expect(layout.loading.value).toBe(false);
    });

    it('sets error on fetch failure', async () => {
      mockFetchResponses(null);
      const layout = useLayout();

      await layout.loadLayoutsIndex();

      expect(layout.error.value).not.toBeNull();
      expect(layout.hasError.value).toBe(true);
    });

    it('clears previous error on successful load', async () => {
      // First call fails
      mockFetchResponses(null);
      const layout = useLayout();
      await layout.loadLayoutsIndex();
      expect(layout.error.value).not.toBeNull();

      // Second call succeeds
      mockFetchResponses();
      await layout.loadLayoutsIndex();
      expect(layout.error.value).toBeNull();
    });

    it('automatically loads default layout after index', async () => {
      mockFetchResponses();
      const layout = useLayout();

      await layout.loadLayoutsIndex();

      expect(layout.layoutConfig.value).not.toBeNull();
      expect(layout.layoutConfig.value?.id).toBe('default');
    });

    it('loads first layout if default not found', async () => {
      const indexWithoutDefault: LayoutsIndex = {
        layouts: [{ id: 'custom', name: 'Custom', path: 'custom' }],
      };
      const customLayout: LayoutConfig = { ...mockDefaultLayout, id: 'custom' };

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(indexWithoutDefault),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(customLayout),
        } as Response);

      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.layoutConfig.value?.id).toBe('custom');
    });
  });

  describe('loadLayout', () => {
    it('loads specific layout by id', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      // Mock compact layout fetch
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCompactLayout),
      } as Response);

      await layout.loadLayout('compact');

      expect(layout.layoutConfig.value?.id).toBe('compact');
      expect(layout.selectedLayoutId.value).toBe('compact');
    });

    it('fetches from correct URL', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCompactLayout),
      } as Response);

      await layout.loadLayout('compact');

      expect(fetchSpy).toHaveBeenCalledWith('/data/layouts/compact/config.json');
    });

    it('sets error when layout not found in index', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      await layout.loadLayout('nonexistent');

      expect(layout.error.value).toContain('non trouvé');
    });

    it('sets error when config fetch fails', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await layout.loadLayout('compact');

      expect(layout.error.value).not.toBeNull();
    });

    it('applies theme after loading layout', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text', '#00ff88');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-accent-cyan', '#00d4ff');
    });
  });

  describe('applyTheme', () => {
    it('sets CSS variables for theme properties', () => {
      const layout = useLayout();

      layout.applyTheme({
        lcdText: '#ff0000',
        accentBlue: '#0000ff',
      });

      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text', '#ff0000');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-accent-blue', '#0000ff');
    });

    it('uses default values for missing theme properties', () => {
      const layout = useLayout();

      layout.applyTheme({});

      // Should apply defaults
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text', '#00ff88');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-primary', '#0a1628');
    });

    it('handles custom theme variables with camelCase to kebab-case conversion', () => {
      const layout = useLayout();

      layout.applyTheme({
        customColor: '#123456',
      });

      expect(setPropertySpy).toHaveBeenCalledWith('--dc-custom-color', '#123456');
    });

    it('maps all standard theme properties correctly', () => {
      const layout = useLayout();
      const fullTheme = {
        bgPrimary: '#111',
        bgSecondary: '#222',
        bgPanel: '#333',
        bgLcd: '#444',
        lcdText: '#555',
        lcdTextDim: '#666',
        lcdWarning: '#777',
        lcdCritical: '#888',
        lcdInfo: '#999',
        accentCyan: '#aaa',
        accentBlue: '#bbb',
        accentPurple: '#ccc',
        gaugeFull: '#ddd',
        gaugeMid: '#eee',
        gaugeLow: '#fff',
        gaugeCritical: '#000',
      };

      layout.applyTheme(fullTheme);

      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-primary', '#111');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-secondary', '#222');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-panel', '#333');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-lcd', '#444');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text', '#555');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text-dim', '#666');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-warning', '#777');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-critical', '#888');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-info', '#999');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-accent-cyan', '#aaa');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-accent-blue', '#bbb');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-accent-purple', '#ccc');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-gauge-full', '#ddd');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-gauge-mid', '#eee');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-gauge-low', '#fff');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-gauge-critical', '#000');
    });
  });

  describe('resetTheme', () => {
    it('resets all theme variables to defaults', () => {
      const layout = useLayout();

      // Apply custom theme first
      layout.applyTheme({ lcdText: '#ff0000' });
      setPropertySpy.mockClear();

      // Reset to defaults
      layout.resetTheme();

      expect(setPropertySpy).toHaveBeenCalledWith('--dc-lcd-text', '#00ff88');
      expect(setPropertySpy).toHaveBeenCalledWith('--dc-bg-primary', '#0a1628');
    });
  });

  describe('selectedLayout computed', () => {
    it('returns the currently selected layout entry', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.selectedLayout.value).not.toBeNull();
      expect(layout.selectedLayout.value?.id).toBe('default');
      expect(layout.selectedLayout.value?.name).toBe('SimDive Default');
    });

    it('returns null when no layout is selected', () => {
      const layout = useLayout();

      expect(layout.selectedLayout.value).toBeNull();
    });
  });

  describe('layout validation', () => {
    it('rejects invalid layout config (missing id)', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLayoutIndex),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              // Missing id
              name: 'Test',
              description: 'Test',
              grid: { columns: 2, gap: '16px' },
              header: { title: 'Test', showModeToggle: true },
              cells: [],
              sections: { safetyStop: true, decoStops: false, warnings: true },
              theme: {},
            }),
        } as Response);

      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.error.value).toContain('invalide');
    });

    it('rejects invalid layout config (missing cells)', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLayoutIndex),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'test',
              name: 'Test',
              description: 'Test',
              grid: { columns: 2, gap: '16px' },
              header: { title: 'Test', showModeToggle: true },
              // Missing cells
              sections: { safetyStop: true, decoStops: false, warnings: true },
              theme: {},
            }),
        } as Response);

      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.error.value).toContain('invalide');
    });

    it('rejects non-object config', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLayoutIndex),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve('not an object'),
        } as Response);

      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.error.value).toContain('invalide');
    });

    it('accepts valid layout config', async () => {
      mockFetchResponses();
      const layout = useLayout();
      await layout.loadLayoutsIndex();

      expect(layout.error.value).toBeNull();
      expect(layout.layoutConfig.value).not.toBeNull();
    });
  });
});
