import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_COMPUTER_MODEL,
  parseAreas,
  useComputerModels,
  validateComputerModel,
} from '../useComputerModels';
import type { ComputerModel } from '../../types/computer';
import index from '../../../public/data/computers/index.json';
import wideWrist from '../../../public/data/computers/wide-wrist.json';
import roundWatch from '../../../public/data/computers/round-watch.json';

const bundledModels: Record<string, unknown> = {
  'wide-wrist.json': wideWrist,
  'round-watch.json': roundWatch,
};

function validModel(overrides: Partial<ComputerModel> = {}): ComputerModel {
  return {
    id: 'test',
    name: 'Test',
    description: 'Modèle de test',
    formFactor: { shape: 'rect', display: 'color', cellStyle: 'flat' },
    screens: [
      {
        id: 'main',
        name: 'Principal',
        areas: ['depth ndl', 'depth time'],
        widgets: [
          { area: 'depth', type: 'depth' },
          { area: 'ndl', type: 'ndl' },
          { area: 'time', type: 'time' },
        ],
      },
    ],
    ...overrides,
  };
}

function withScreen(screen: Partial<ComputerModel['screens'][number]>): ComputerModel {
  const base = validModel();
  return { ...base, screens: [{ ...base.screens[0], ...screen }] };
}

describe('parseAreas', () => {
  it('splits rows into area names, ignoring extra whitespace', () => {
    expect(parseAreas(['a  b', ' c d '])).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('validateComputerModel', () => {
  it('accepts the built-in SimDive model', () => {
    expect(validateComputerModel(DEFAULT_COMPUTER_MODEL)).toEqual([]);
  });

  it.each(Object.entries(bundledModels))('accepts the bundled model %s', (_file, model) => {
    expect(validateComputerModel(model)).toEqual([]);
  });

  it('accepts a minimal valid model', () => {
    expect(validateComputerModel(validModel())).toEqual([]);
  });

  it('rejects non-object input', () => {
    expect(validateComputerModel(null)).toHaveLength(1);
    expect(validateComputerModel([])).toHaveLength(1);
  });

  it('requires id, name and description', () => {
    const errors = validateComputerModel({
      ...validModel(),
      id: '',
      name: undefined,
      description: 1,
    });
    expect(errors.join('\n')).toContain('"id" manquant');
    expect(errors.join('\n')).toContain('"name" manquant');
    expect(errors.join('\n')).toContain('"description" manquante');
  });

  it('rejects an unknown shape, display or cell style', () => {
    const errors = validateComputerModel({
      ...validModel(),
      formFactor: { shape: 'square', display: 'oled', cellStyle: 'boxed' },
    });
    expect(errors).toHaveLength(3);
  });

  it('requires at least one screen', () => {
    expect(validateComputerModel(validModel({ screens: [] }))[0]).toContain('au moins un écran');
  });

  it('rejects duplicate screen ids', () => {
    const model = validModel();
    model.screens.push({ ...model.screens[0] });
    expect(validateComputerModel(model).join()).toContain('"main" en double');
  });

  it('rejects rows with different column counts', () => {
    const errors = validateComputerModel(withScreen({ areas: ['depth ndl', 'time'] }));
    expect(errors.join()).toContain('même nombre de colonnes');
  });

  it('rejects non-rectangular areas', () => {
    const errors = validateComputerModel(
      withScreen({
        areas: ['depth ndl', 'time depth'],
        widgets: [{ area: 'depth', type: 'depth' }],
      })
    );
    expect(errors.join()).toContain('"depth" doit former un rectangle');
  });

  it('allows "." as an empty cell', () => {
    const errors = validateComputerModel(
      withScreen({ areas: ['depth .', 'depth time'], widgets: [{ area: 'depth', type: 'depth' }] })
    );
    expect(errors).toEqual([]);
  });

  it('rejects a widget placed in an area missing from the template', () => {
    const errors = validateComputerModel(
      withScreen({ widgets: [{ area: 'nowhere', type: 'depth' }] })
    );
    expect(errors.join()).toContain('"nowhere" n\'existe pas');
  });

  it('rejects an unknown widget type', () => {
    const errors = validateComputerModel(
      withScreen({ widgets: [{ area: 'depth', type: 'temperature' as never }] })
    );
    expect(errors.join()).toContain('type de widget inconnu "temperature"');
  });

  it('rejects an invalid widget size', () => {
    const errors = validateComputerModel(
      withScreen({ widgets: [{ area: 'depth', type: 'depth', size: 'xxl' as never }] })
    );
    expect(errors.join()).toContain('taille "xxl" invalide');
  });

  it('rejects two widgets in the same area', () => {
    const errors = validateComputerModel(
      withScreen({
        widgets: [
          { area: 'depth', type: 'depth' },
          { area: 'depth', type: 'maxDepth' },
        ],
      })
    );
    expect(errors.join()).toContain('utilisée par plusieurs widgets');
  });

  it('rejects unknown theme keys and non-string colours', () => {
    const errors = validateComputerModel({
      ...validModel(),
      theme: { lcdText: 42, lcdTxt: '#fff' },
    });
    expect(errors).toHaveLength(2);
    expect(errors.join()).toContain('couleur de thème inconnue "lcdTxt"');
  });
});

describe('useComputerModels', () => {
  const fetchMock = vi.fn();

  function respondWith(files: Record<string, unknown>) {
    fetchMock.mockImplementation(async (url: string) => {
      const file = url.replace('/data/computers/', '');
      if (!(file in files)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => files[file] };
    });
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('starts with the built-in model only', () => {
    const { models, errors } = useComputerModels();
    expect(models.value.map((m) => m.id)).toEqual(['simdive']);
    expect(errors.value).toEqual([]);
  });

  it('loads the bundled models after the built-in one', async () => {
    respondWith({ 'index.json': index, ...bundledModels });
    const { models, errors, loading, load } = useComputerModels();

    await load();

    expect(models.value.map((m) => m.id)).toEqual(['simdive', 'wide-wrist', 'round-watch']);
    expect(errors.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('/data/computers/index.json');
  });

  it('skips an invalid model and reports why', async () => {
    respondWith({
      'index.json': { models: [{ id: 'bad', file: 'bad.json' }, index.models[0]] },
      'bad.json': { ...validModel({ id: 'bad' }), screens: [] },
      ...bundledModels,
    });
    const { models, errors, load } = useComputerModels();

    await load();

    expect(models.value.map((m) => m.id)).toEqual(['simdive', 'wide-wrist']);
    expect(errors.value).toHaveLength(1);
    expect(errors.value[0]).toContain('Modèle "bad"');
  });

  it('reports a missing model file', async () => {
    respondWith({ 'index.json': { models: [{ id: 'ghost', file: 'ghost.json' }] } });
    const { models, errors, load } = useComputerModels();

    await load();

    expect(models.value).toHaveLength(1);
    expect(errors.value[0]).toContain('"ghost.json" introuvable');
  });

  it('rejects a model whose id does not match the index', async () => {
    respondWith({
      'index.json': { models: [{ id: 'other', file: 'test.json' }] },
      'test.json': validModel(),
    });
    const { models, errors, load } = useComputerModels();

    await load();

    expect(models.value).toHaveLength(1);
    expect(errors.value[0]).toContain('ne correspond pas');
  });

  it('rejects a model reusing the built-in id', async () => {
    respondWith({
      'index.json': { models: [{ id: 'simdive', file: 'test.json' }] },
      'test.json': validModel({ id: 'simdive' }),
    });
    const { models, errors, load } = useComputerModels();

    await load();

    expect(models.value).toEqual([DEFAULT_COMPUTER_MODEL]);
    expect(errors.value[0]).toContain('identifiant déjà utilisé');
  });

  it('keeps the built-in model when the index cannot be loaded', async () => {
    respondWith({});
    const { models, errors, load } = useComputerModels();

    await load();

    expect(models.value).toEqual([DEFAULT_COMPUTER_MODEL]);
    expect(errors.value[0]).toContain('"index.json" introuvable');
  });
});
