import { ref, computed, watch } from 'vue';
import type { LayoutConfig, LayoutsIndex, LayoutIndexEntry, LayoutTheme } from '../types/dive';

// Default theme values (matching dive-computer.css)
const DEFAULT_THEME: Required<LayoutTheme> = {
  bgPrimary: '#0a1628',
  bgSecondary: '#0f2847',
  bgPanel: '#122a4d',
  bgLcd: '#1a3a5c',
  lcdText: '#00ff88',
  lcdTextDim: '#00994d',
  lcdWarning: '#ffcc00',
  lcdCritical: '#ff3344',
  lcdInfo: '#00aaff',
  accentCyan: '#00d4ff',
  accentBlue: '#0066cc',
  accentPurple: '#6644ff',
  gaugeFull: '#00ff88',
  gaugeMid: '#ffcc00',
  gaugeLow: '#ff6600',
  gaugeCritical: '#ff3344',
};

// CSS variable name mapping (camelCase to kebab-case with dc- prefix)
const THEME_TO_CSS_VAR: Record<string, string> = {
  bgPrimary: '--dc-bg-primary',
  bgSecondary: '--dc-bg-secondary',
  bgPanel: '--dc-bg-panel',
  bgLcd: '--dc-bg-lcd',
  lcdText: '--dc-lcd-text',
  lcdTextDim: '--dc-lcd-text-dim',
  lcdWarning: '--dc-lcd-warning',
  lcdCritical: '--dc-lcd-critical',
  lcdInfo: '--dc-lcd-info',
  accentCyan: '--dc-accent-cyan',
  accentBlue: '--dc-accent-blue',
  accentPurple: '--dc-accent-purple',
  gaugeFull: '--dc-gauge-full',
  gaugeMid: '--dc-gauge-mid',
  gaugeLow: '--dc-gauge-low',
  gaugeCritical: '--dc-gauge-critical',
};

/**
 * Composable for managing dive computer layouts
 */
export function useLayout() {
  // State
  const layouts = ref<LayoutIndexEntry[]>([]);
  const selectedLayoutId = ref<string>('default');
  const layoutConfig = ref<LayoutConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load available layouts from the layouts index
   */
  async function loadLayoutsIndex(): Promise<void> {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch('/data/layouts/layouts.json');
      if (!response.ok) {
        throw new Error('Erreur de chargement de la liste des layouts');
      }

      const data: LayoutsIndex = await response.json();
      layouts.value = data.layouts;

      // Load default layout if none selected
      if (layouts.value.length > 0 && !layoutConfig.value) {
        const defaultLayout = layouts.value.find((l) => l.id === 'default') || layouts.value[0];
        await loadLayout(defaultLayout.id);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('Failed to load layouts index:', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load a specific layout configuration
   */
  async function loadLayout(layoutId: string): Promise<void> {
    try {
      loading.value = true;
      error.value = null;

      const layoutEntry = layouts.value.find((l) => l.id === layoutId);
      if (!layoutEntry) {
        throw new Error(`Layout "${layoutId}" non trouvé`);
      }

      const response = await fetch(`/data/layouts/${layoutEntry.path}/config.json`);
      if (!response.ok) {
        throw new Error(`Erreur de chargement du layout "${layoutEntry.name}"`);
      }

      const config: LayoutConfig = await response.json();

      // Validate layout config
      if (!validateLayoutConfig(config)) {
        throw new Error(`Configuration du layout "${config.name}" invalide`);
      }

      layoutConfig.value = config;
      selectedLayoutId.value = layoutId;

      // Apply theme
      applyTheme(config.theme);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('Failed to load layout:', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Validate layout configuration
   */
  function validateLayoutConfig(config: unknown): config is LayoutConfig {
    if (!config || typeof config !== 'object') return false;

    const c = config as Record<string, unknown>;

    return (
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      typeof c.description === 'string' &&
      typeof c.grid === 'object' &&
      c.grid !== null &&
      typeof c.header === 'object' &&
      c.header !== null &&
      Array.isArray(c.cells) &&
      typeof c.sections === 'object' &&
      c.sections !== null &&
      typeof c.theme === 'object' &&
      c.theme !== null
    );
  }

  /**
   * Apply theme CSS variables to the document
   */
  function applyTheme(theme: LayoutTheme): void {
    const root = document.documentElement;

    // Apply each theme variable, using defaults for missing values
    for (const [key, cssVar] of Object.entries(THEME_TO_CSS_VAR)) {
      const value = theme[key] ?? DEFAULT_THEME[key as keyof typeof DEFAULT_THEME];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    }

    // Apply any custom theme variables not in the standard mapping
    for (const [key, value] of Object.entries(theme)) {
      if (!THEME_TO_CSS_VAR[key] && value) {
        // Convert camelCase to kebab-case and add dc- prefix
        const cssVar = `--dc-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      }
    }
  }

  /**
   * Reset theme to default values
   */
  function resetTheme(): void {
    applyTheme(DEFAULT_THEME);
  }

  // Computed
  const selectedLayout = computed(() => {
    return layouts.value.find((l) => l.id === selectedLayoutId.value) || null;
  });

  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

  return {
    // State
    layouts,
    selectedLayoutId,
    layoutConfig,
    loading: isLoading,
    error,

    // Computed
    selectedLayout,
    hasError,

    // Methods
    loadLayoutsIndex,
    loadLayout,
    applyTheme,
    resetTheme,
  };
}
