import { ref } from 'vue';
import type {
  ComputerModel,
  ComputerModelsIndex,
  ComputerScreen,
  ComputerTheme,
  ScreenWidget,
} from '../types/computer';
import { THEME_KEYS, WIDGET_SIZES, WIDGET_TYPES } from '../types/computer';

const MODELS_BASE_PATH = '/data/computers';

/**
 * Built-in SimDive model. It is always available, even if the model files fail to load,
 * and is the only place where the default display is defined.
 */
export const DEFAULT_COMPUTER_MODEL: ComputerModel = {
  id: 'simdive',
  name: 'SimDive',
  description: 'Affichage pédagogique SimDive : toutes les informations essentielles sur un écran.',
  formFactor: { shape: 'rect', display: 'color', cellStyle: 'panel' },
  screens: [
    {
      id: 'main',
      name: 'Principal',
      areas: ['depth depth', 'time ndl', 'air autonomy', 'stop stop', 'warnings warnings'],
      widgets: [
        { area: 'depth', type: 'depth', size: 'xl', showMax: true, highlight: true },
        { area: 'time', type: 'time', size: 'lg' },
        { area: 'ndl', type: 'ndl', size: 'lg' },
        { area: 'air', type: 'air', size: 'lg', showGauge: true },
        { area: 'autonomy', type: 'autonomy', size: 'lg' },
        { area: 'stop', type: 'safetyStop' },
        { area: 'warnings', type: 'warnings' },
      ],
    },
  ],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Split grid-template-areas rows into a matrix of area names */
export function parseAreas(areas: string[]): string[][] {
  return areas.map((row) => row.trim().split(/\s+/));
}

/**
 * Check the areas template is one CSS accepts: every row has the same number of columns
 * and every named area is a rectangle (otherwise the browser drops the whole template).
 */
function validateAreas(areas: string[], where: string): string[] {
  const errors: string[] = [];
  const grid = parseAreas(areas);
  const width = grid[0].length;

  if (grid.some((row) => row.length !== width)) {
    errors.push(`${where} : toutes les lignes de "areas" doivent avoir le même nombre de colonnes`);
    return errors;
  }

  const bounds = new Map<
    string,
    { top: number; bottom: number; left: number; right: number; count: number }
  >();
  grid.forEach((row, r) =>
    row.forEach((name, c) => {
      if (name === '.') return;
      const b = bounds.get(name);
      if (!b) {
        bounds.set(name, { top: r, bottom: r, left: c, right: c, count: 1 });
      } else {
        b.top = Math.min(b.top, r);
        b.bottom = Math.max(b.bottom, r);
        b.left = Math.min(b.left, c);
        b.right = Math.max(b.right, c);
        b.count++;
      }
    })
  );

  for (const [name, b] of bounds) {
    const expected = (b.bottom - b.top + 1) * (b.right - b.left + 1);
    if (b.count !== expected) {
      errors.push(`${where} : la zone "${name}" doit former un rectangle`);
    }
  }

  return errors;
}

function validateWidget(widget: unknown, areaNames: Set<string>, where: string): string[] {
  if (!isObject(widget)) return [`${where} : widget invalide`];

  const errors: string[] = [];
  const w = widget as Partial<ScreenWidget>;

  if (!WIDGET_TYPES.includes(w.type as never)) {
    errors.push(`${where} : type de widget inconnu "${String(w.type)}"`);
  }
  if (!isNonEmptyString(w.area) || !areaNames.has(w.area)) {
    errors.push(`${where} : la zone "${String(w.area)}" n'existe pas dans "areas"`);
  }
  if (w.size !== undefined && !WIDGET_SIZES.includes(w.size)) {
    errors.push(`${where} : taille "${String(w.size)}" invalide (${WIDGET_SIZES.join(', ')})`);
  }

  return errors;
}

function validateScreen(screen: unknown, where: string): string[] {
  if (!isObject(screen)) return [`${where} : écran invalide`];

  const s = screen as Partial<ComputerScreen>;
  const name = isNonEmptyString(s.id) ? `${where} "${s.id}"` : where;
  const errors: string[] = [];

  if (!isNonEmptyString(s.id)) errors.push(`${where} : "id" manquant`);
  if (!isNonEmptyString(s.name)) errors.push(`${name} : "name" manquant`);
  if (s.columns !== undefined && !isNonEmptyString(s.columns)) {
    errors.push(`${name} : "columns" doit être une chaîne CSS`);
  }

  if (!Array.isArray(s.areas) || s.areas.length === 0 || !s.areas.every(isNonEmptyString)) {
    errors.push(`${name} : "areas" doit être une liste de lignes non vide`);
    return errors;
  }
  errors.push(...validateAreas(s.areas, name));

  if (!Array.isArray(s.widgets)) {
    errors.push(`${name} : "widgets" doit être une liste`);
    return errors;
  }

  const areaNames = new Set(parseAreas(s.areas).flat());
  areaNames.delete('.');
  const used = new Set<string>();
  s.widgets.forEach((widget, i) => {
    errors.push(...validateWidget(widget, areaNames, `${name}, widget ${i + 1}`));
    const area = isObject(widget) ? widget.area : undefined;
    if (typeof area === 'string') {
      if (used.has(area))
        errors.push(`${name} : la zone "${area}" est utilisée par plusieurs widgets`);
      used.add(area);
    }
  });

  return errors;
}

function validateTheme(theme: unknown, where: string): string[] {
  if (!isObject(theme)) return [`${where} : "theme" doit être un objet`];

  const errors: string[] = [];
  for (const [key, value] of Object.entries(theme)) {
    if (!THEME_KEYS.includes(key as keyof ComputerTheme)) {
      errors.push(`${where} : couleur de thème inconnue "${key}"`);
    } else if (typeof value !== 'string') {
      errors.push(`${where} : la couleur "${key}" doit être une chaîne`);
    }
  }
  return errors;
}

/**
 * Validate a computer model loaded from JSON.
 * Returns a list of human readable (French) errors, empty when the model is valid.
 */
export function validateComputerModel(raw: unknown): string[] {
  if (!isObject(raw)) return ['Le modèle doit être un objet JSON'];

  const m = raw as Partial<ComputerModel>;
  const where = isNonEmptyString(m.id) ? `Modèle "${m.id}"` : 'Modèle';
  const errors: string[] = [];

  if (!isNonEmptyString(m.id)) errors.push(`${where} : "id" manquant`);
  if (!isNonEmptyString(m.name)) errors.push(`${where} : "name" manquant`);
  if (typeof m.description !== 'string') errors.push(`${where} : "description" manquante`);

  const ff = m.formFactor;
  if (!isObject(ff)) {
    errors.push(`${where} : "formFactor" manquant`);
  } else {
    if (!['rect', 'round'].includes(ff.shape as string)) {
      errors.push(`${where} : "formFactor.shape" doit valoir "rect" ou "round"`);
    }
    if (!['segment-lcd', 'color'].includes(ff.display as string)) {
      errors.push(`${where} : "formFactor.display" doit valoir "segment-lcd" ou "color"`);
    }
    if (!['panel', 'flat'].includes(ff.cellStyle as string)) {
      errors.push(`${where} : "formFactor.cellStyle" doit valoir "panel" ou "flat"`);
    }
    if (ff.aspectRatio !== undefined && !isNonEmptyString(ff.aspectRatio)) {
      errors.push(`${where} : "formFactor.aspectRatio" doit être une chaîne CSS (ex. "16 / 10")`);
    }
  }

  if (!Array.isArray(m.screens) || m.screens.length === 0) {
    errors.push(`${where} : au moins un écran est requis dans "screens"`);
  } else {
    const ids = new Set<string>();
    m.screens.forEach((screen, i) => {
      errors.push(...validateScreen(screen, `${where}, écran ${i + 1}`));
      const id = isObject(screen) ? screen.id : undefined;
      if (typeof id === 'string') {
        if (ids.has(id)) errors.push(`${where} : identifiant d'écran "${id}" en double`);
        ids.add(id);
      }
    });
  }

  if (m.theme !== undefined) errors.push(...validateTheme(m.theme, where));

  return errors;
}

/**
 * Loads the dive computer models listed in public/data/computers/index.json.
 * The built-in SimDive model is always first; invalid files are skipped and reported in `errors`.
 */
export function useComputerModels() {
  const models = ref<ComputerModel[]>([DEFAULT_COMPUTER_MODEL]);
  const errors = ref<string[]>([]);
  const loading = ref(false);

  async function fetchJson(path: string): Promise<unknown> {
    const response = await fetch(`${MODELS_BASE_PATH}/${path}`);
    if (!response.ok) throw new Error(`Fichier "${path}" introuvable (${response.status})`);
    return response.json();
  }

  async function load(): Promise<void> {
    loading.value = true;
    const loadErrors: string[] = [];
    const loaded: ComputerModel[] = [DEFAULT_COMPUTER_MODEL];

    try {
      const index = (await fetchJson('index.json')) as ComputerModelsIndex;
      if (!isObject(index) || !Array.isArray(index.models)) {
        throw new Error('"index.json" doit contenir une liste "models"');
      }

      const results = await Promise.all(
        index.models.map(async (entry) => {
          try {
            return { entry, raw: await fetchJson(entry.file) };
          } catch (e) {
            return { entry, error: e instanceof Error ? e.message : String(e) };
          }
        })
      );

      for (const result of results) {
        if ('error' in result) {
          loadErrors.push(`Modèle "${result.entry.id}" : ${result.error}`);
          continue;
        }
        const modelErrors = validateComputerModel(result.raw);
        if (modelErrors.length > 0) {
          loadErrors.push(...modelErrors);
          continue;
        }
        const model = result.raw as ComputerModel;
        if (model.id !== result.entry.id) {
          loadErrors.push(
            `Modèle "${result.entry.id}" : l'id du fichier ("${model.id}") ne correspond pas à l'index`
          );
        } else if (loaded.some((m) => m.id === model.id)) {
          loadErrors.push(`Modèle "${model.id}" : identifiant déjà utilisé`);
        } else {
          loaded.push(model);
        }
      }
    } catch (e) {
      loadErrors.push(e instanceof Error ? e.message : String(e));
    }

    models.value = loaded;
    errors.value = loadErrors;
    loading.value = false;
    if (loadErrors.length > 0) console.warn('Computer models loaded with errors:', loadErrors);
  }

  return { models, errors, loading, load };
}
