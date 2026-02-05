import { describe, it, expect } from 'vitest';
import type { LayoutConfig, LayoutsIndex, CellType, DisplayMode } from '../dive';

// Import the actual default layout for testing
import defaultLayoutConfig from '../../../public/data/layouts/default/config.json';

describe('Layout Types', () => {
  describe('CellType', () => {
    it('includes all expected cell types', () => {
      const validTypes: CellType[] = [
        'depth',
        'time',
        'ndl',
        'air',
        'autonomy',
        'tts',
        'ceiling',
        'ascentRate',
        'sac',
      ];

      // This test ensures the types compile correctly
      expect(validTypes).toHaveLength(9);
    });
  });

  describe('DisplayMode', () => {
    it('includes essential and expert modes', () => {
      const modes: DisplayMode[] = ['essential', 'expert'];
      expect(modes).toHaveLength(2);
    });
  });
});

describe('Default Layout Configuration', () => {
  const layout = defaultLayoutConfig as LayoutConfig;

  describe('Basic Properties', () => {
    it('has required id property', () => {
      expect(layout.id).toBe('default');
    });

    it('has required name property', () => {
      expect(layout.name).toBe('SimDive Default');
      expect(typeof layout.name).toBe('string');
    });

    it('has required description property', () => {
      expect(typeof layout.description).toBe('string');
      expect(layout.description.length).toBeGreaterThan(0);
    });
  });

  describe('Grid Configuration', () => {
    it('has grid configuration', () => {
      expect(layout.grid).toBeDefined();
    });

    it('has valid columns count', () => {
      expect(layout.grid.columns).toBe(2);
      expect(typeof layout.grid.columns).toBe('number');
      expect(layout.grid.columns).toBeGreaterThan(0);
    });

    it('has valid gap value', () => {
      expect(layout.grid.gap).toBe('16px');
      expect(typeof layout.grid.gap).toBe('string');
    });
  });

  describe('Header Configuration', () => {
    it('has header configuration', () => {
      expect(layout.header).toBeDefined();
    });

    it('has title', () => {
      expect(layout.header.title).toBe('SimDive');
      expect(typeof layout.header.title).toBe('string');
    });

    it('has showModeToggle setting', () => {
      expect(layout.header.showModeToggle).toBe(true);
      expect(typeof layout.header.showModeToggle).toBe('boolean');
    });
  });

  describe('Cells Configuration', () => {
    it('has cells array', () => {
      expect(Array.isArray(layout.cells)).toBe(true);
    });

    it('has at least one cell', () => {
      expect(layout.cells.length).toBeGreaterThan(0);
    });

    it('each cell has a type property', () => {
      for (const cell of layout.cells) {
        expect(cell.type).toBeDefined();
        expect(typeof cell.type).toBe('string');
      }
    });

    it('includes essential cells (depth, time, air)', () => {
      const cellTypes = layout.cells.map((c) => c.type);
      expect(cellTypes).toContain('depth');
      expect(cellTypes).toContain('time');
      expect(cellTypes).toContain('air');
    });

    it('includes NDL cell', () => {
      const ndlCell = layout.cells.find((c) => c.type === 'ndl');
      expect(ndlCell).toBeDefined();
    });

    it('depth cell is configured as primary', () => {
      const depthCell = layout.cells.find((c) => c.type === 'depth');
      expect(depthCell?.primary).toBe(true);
    });

    it('depth cell spans 2 columns', () => {
      const depthCell = layout.cells.find((c) => c.type === 'depth');
      expect(depthCell?.span).toBe(2);
    });

    it('depth cell shows max depth', () => {
      const depthCell = layout.cells.find((c) => c.type === 'depth');
      expect(depthCell?.showMax).toBe(true);
    });

    it('air cell shows gauge', () => {
      const airCell = layout.cells.find((c) => c.type === 'air');
      expect(airCell?.showGauge).toBe(true);
    });

    it('expert-only cells have mode set to expert', () => {
      const expertCells = layout.cells.filter((c) => c.mode === 'expert');
      expect(expertCells.length).toBeGreaterThan(0);

      const expertTypes = expertCells.map((c) => c.type);
      expect(expertTypes).toContain('tts');
      expect(expertTypes).toContain('ceiling');
      expect(expertTypes).toContain('ascentRate');
      expect(expertTypes).toContain('sac');
    });

    it('essential cells do not have mode restriction', () => {
      const essentialCells = layout.cells.filter(
        (c) => c.type === 'depth' || c.type === 'time' || c.type === 'air' || c.type === 'ndl'
      );

      for (const cell of essentialCells) {
        // Essential cells should not have mode restriction (shown in both modes)
        expect(cell.mode).toBeUndefined();
      }
    });

    it('cells have labels', () => {
      for (const cell of layout.cells) {
        expect(cell.label).toBeDefined();
        expect(typeof cell.label).toBe('string');
      }
    });

    it('NDL cell has alternative label for deco mode', () => {
      const ndlCell = layout.cells.find((c) => c.type === 'ndl');
      expect(ndlCell?.labelDeco).toBe('Palier');
    });
  });

  describe('Sections Configuration', () => {
    it('has sections configuration', () => {
      expect(layout.sections).toBeDefined();
    });

    it('has safetyStop setting', () => {
      expect(layout.sections.safetyStop).toBe(true);
      expect(typeof layout.sections.safetyStop).toBe('boolean');
    });

    it('has decoStops setting', () => {
      expect(layout.sections.decoStops).toBe('expert');
    });

    it('has warnings setting', () => {
      expect(layout.sections.warnings).toBe(true);
      expect(typeof layout.sections.warnings).toBe('boolean');
    });
  });

  describe('Theme Configuration', () => {
    it('has theme configuration', () => {
      expect(layout.theme).toBeDefined();
      expect(typeof layout.theme).toBe('object');
    });

    it('has LCD text color', () => {
      expect(layout.theme.lcdText).toBe('#00ff88');
    });

    it('has accent cyan color', () => {
      expect(layout.theme.accentCyan).toBe('#00d4ff');
    });

    it('has accent blue color', () => {
      expect(layout.theme.accentBlue).toBe('#0066cc');
    });

    it('has warning color', () => {
      expect(layout.theme.lcdWarning).toBe('#ffcc00');
    });

    it('has critical color', () => {
      expect(layout.theme.lcdCritical).toBe('#ff3344');
    });

    it('has background colors', () => {
      expect(layout.theme.bgPrimary).toBe('#0a1628');
      expect(layout.theme.bgSecondary).toBe('#0f2847');
      expect(layout.theme.bgPanel).toBe('#122a4d');
      expect(layout.theme.bgLcd).toBe('#1a3a5c');
    });

    it('has gauge colors', () => {
      expect(layout.theme.gaugeFull).toBe('#00ff88');
      expect(layout.theme.gaugeMid).toBe('#ffcc00');
      expect(layout.theme.gaugeLow).toBe('#ff6600');
      expect(layout.theme.gaugeCritical).toBe('#ff3344');
    });

    it('all color values are valid hex codes', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      for (const [key, value] of Object.entries(layout.theme)) {
        if (typeof value === 'string' && !key.startsWith('$')) {
          expect(value).toMatch(hexColorRegex);
        }
      }
    });
  });
});

describe('Layouts Index', () => {
  // Import the actual layouts index
  const loadLayoutsIndex = async (): Promise<LayoutsIndex> => {
    const module = await import('../../../public/data/layouts/layouts.json');
    return module.default as LayoutsIndex;
  };

  it('has layouts array', async () => {
    const index = await loadLayoutsIndex();
    expect(Array.isArray(index.layouts)).toBe(true);
  });

  it('has at least one layout', async () => {
    const index = await loadLayoutsIndex();
    expect(index.layouts.length).toBeGreaterThan(0);
  });

  it('includes default layout', async () => {
    const index = await loadLayoutsIndex();
    const defaultLayout = index.layouts.find((l) => l.id === 'default');
    expect(defaultLayout).toBeDefined();
  });

  it('each layout entry has required properties', async () => {
    const index = await loadLayoutsIndex();

    for (const layout of index.layouts) {
      expect(layout.id).toBeDefined();
      expect(typeof layout.id).toBe('string');
      expect(layout.name).toBeDefined();
      expect(typeof layout.name).toBe('string');
      expect(layout.path).toBeDefined();
      expect(typeof layout.path).toBe('string');
    }
  });

  it('default layout has correct path', async () => {
    const index = await loadLayoutsIndex();
    const defaultLayout = index.layouts.find((l) => l.id === 'default');
    expect(defaultLayout?.path).toBe('default');
  });

  it('layout ids are unique', async () => {
    const index = await loadLayoutsIndex();
    const ids = index.layouts.map((l) => l.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

describe('Layout Cell Validation', () => {
  describe('Cell Type Validation', () => {
    const validCellTypes = [
      'depth',
      'time',
      'ndl',
      'air',
      'autonomy',
      'tts',
      'ceiling',
      'ascentRate',
      'sac',
    ];

    it('all default layout cells have valid types', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        expect(validCellTypes).toContain(cell.type);
      }
    });
  });

  describe('Cell Optional Properties', () => {
    it('span must be a positive number when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        if (cell.span !== undefined) {
          expect(typeof cell.span).toBe('number');
          expect(cell.span).toBeGreaterThan(0);
        }
      }
    });

    it('primary must be a boolean when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        if (cell.primary !== undefined) {
          expect(typeof cell.primary).toBe('boolean');
        }
      }
    });

    it('mode must be a valid DisplayMode when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;
      const validModes = ['essential', 'expert'];

      for (const cell of layout.cells) {
        if (cell.mode !== undefined) {
          expect(validModes).toContain(cell.mode);
        }
      }
    });

    it('showMax must be a boolean when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        if (cell.showMax !== undefined) {
          expect(typeof cell.showMax).toBe('boolean');
        }
      }
    });

    it('showGauge must be a boolean when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        if (cell.showGauge !== undefined) {
          expect(typeof cell.showGauge).toBe('boolean');
        }
      }
    });

    it('label must be a non-empty string when present', () => {
      const layout = defaultLayoutConfig as LayoutConfig;

      for (const cell of layout.cells) {
        if (cell.label !== undefined) {
          expect(typeof cell.label).toBe('string');
          expect(cell.label.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('Theme Color Consistency', () => {
  const layout = defaultLayoutConfig as LayoutConfig;

  it('critical colors match across different uses', () => {
    // lcdCritical and gaugeCritical should be the same
    expect(layout.theme.lcdCritical).toBe(layout.theme.gaugeCritical);
  });

  it('full gauge color matches lcd text color', () => {
    // Good air = green, same as lcd text
    expect(layout.theme.gaugeFull).toBe(layout.theme.lcdText);
  });

  it('warning colors match for gauge mid', () => {
    expect(layout.theme.gaugeMid).toBe(layout.theme.lcdWarning);
  });

  it('background colors follow dark to light gradient', () => {
    // bgPrimary should be darkest
    const primary = parseInt(layout.theme.bgPrimary!.slice(1), 16);
    const secondary = parseInt(layout.theme.bgSecondary!.slice(1), 16);
    const panel = parseInt(layout.theme.bgPanel!.slice(1), 16);
    const lcd = parseInt(layout.theme.bgLcd!.slice(1), 16);

    // Each should be brighter than the previous
    expect(secondary).toBeGreaterThan(primary);
    expect(panel).toBeGreaterThan(secondary);
    expect(lcd).toBeGreaterThan(panel);
  });
});
