import { EncoderState, ProcessorState, encoderMap } from '../feature-meta';

export interface CompressionPresetSettings {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

export interface CompressionPreset {
  id: string;
  name: string;
  settings: CompressionPresetSettings;
}

const storageKey = 'vicoco-compression-presets';

const cloneSettings = (
  settings: CompressionPresetSettings,
): CompressionPresetSettings => JSON.parse(JSON.stringify(settings));

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

const isSettings = (value: unknown): value is CompressionPresetSettings => {
  if (!isObject(value) || !isObject(value.processorState)) return false;
  return (
    value.encoderState === undefined ||
    (isObject(value.encoderState) &&
      typeof value.encoderState.type === 'string' &&
      value.encoderState.type in encoderMap &&
      isObject(value.encoderState.options))
  );
};

const isPreset = (value: unknown): value is CompressionPreset =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isSettings(value.settings);

const readLegacyPreset = (
  key: 'leftSideSettings' | 'rightSideSettings',
  name: string,
): CompressionPreset | undefined => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const parsed = JSON.parse(stored) as { latestSettings?: unknown };
    if (!isSettings(parsed.latestSettings)) return;
    return {
      id: `legacy-${key}`,
      name,
      settings: cloneSettings(parsed.latestSettings),
    };
  } catch (_) {
    return;
  }
};

export const loadCompressionPresets = (): CompressionPreset[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isPreset) : [];
    }
  } catch (_) {}

  const migrated = [
    readLegacyPreset('leftSideSettings', 'Saved left'),
    readLegacyPreset('rightSideSettings', 'Saved right'),
  ].filter((preset): preset is CompressionPreset => !!preset);

  if (migrated.length) saveCompressionPresets(migrated);
  return migrated;
};

export const saveCompressionPresets = (presets: CompressionPreset[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(presets));
  } catch (_) {}
};

export const createCompressionPreset = (
  name: string,
  settings: CompressionPresetSettings,
): CompressionPreset => {
  const randomId = Array.from(crypto.getRandomValues(new Uint32Array(2)))
    .map((part) => part.toString(36))
    .join('');
  return {
    id: `${Date.now()}-${randomId}`,
    name,
    settings: cloneSettings(settings),
  };
};

export const copyCompressionPresetSettings = cloneSettings;
