export const defaultBatchNamePattern = '{name}';

export interface BatchNameContext {
  sourceName: string;
  extension: string;
  width: number;
  height: number;
  index: number;
  total: number;
}

const invalidFilenameCharacters = /[\u0000-\u001f<>:"/\\|?*]/g;
const invalidFilenameCharacter = /[\u0000-\u001f<>:"/\\|?*]/;
const reservedWindowsFilename =
  /^(con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9]|lpt[1-9])(?:\.|$)/i;
const supportedBatchNameToken = /\{(name|index|width|height)\}/g;

function sanitizeFilenameStem(
  value: string,
  fallback: string,
  maxLength: number,
): string {
  let filename = value
    .replace(invalidFilenameCharacters, '-')
    .trim()
    .replace(/[ .]+$/g, '')
    .slice(0, maxLength);

  if (!filename) filename = fallback;
  if (reservedWindowsFilename.test(filename)) filename = `_${filename}`;
  return filename.slice(0, maxLength);
}

export function fileStem(filename: string): string {
  const separator = Math.max(
    filename.lastIndexOf('/'),
    filename.lastIndexOf('\\'),
  );
  const basename = filename.slice(separator + 1);
  const extension = basename.lastIndexOf('.');
  return extension > 0 ? basename.slice(0, extension) : basename;
}

export function fileExtension(filename: string): string {
  const extension = filename.lastIndexOf('.');
  return extension > 0 && extension < filename.length - 1
    ? filename.slice(extension + 1)
    : '';
}

export function batchNamePatternError(pattern: string): string | undefined {
  if (!pattern.trim()) return;
  const remainder = pattern.replace(supportedBatchNameToken, '');
  if (/[{}]/.test(remainder)) {
    return 'Use only {name}, {index}, {width}, or {height} variables.';
  }
}

export function batchNamePatternWarning(pattern: string): string | undefined {
  if (invalidFilenameCharacter.test(pattern)) {
    return 'Unsupported filename characters will be replaced with -.';
  }
  if (/[ .]+$/.test(pattern)) {
    return 'Trailing spaces and dots will be removed.';
  }
}

export function formatZipFilename(filename: string): string {
  const stem = sanitizeFilenameStem(
    filename.replace(/\.zip$/i, ''),
    'vicoco-images',
    76,
  );
  return `${stem}.zip`;
}

export function formatBatchFilename(
  pattern: string,
  context: BatchNameContext,
): string {
  const index = String(context.index).padStart(
    Math.max(2, String(context.total).length),
    '0',
  );
  const values = {
    name: fileStem(context.sourceName),
    index,
    width: String(context.width),
    height: String(context.height),
  };
  const template = pattern.trim() || defaultBatchNamePattern;
  const extension = context.extension.replace(/[^a-z0-9]/gi, '');
  let filename = template.replace(
    /\{(name|index|width|height)\}/g,
    (_, token: keyof typeof values) => values[token],
  );

  if (extension && filename.toLowerCase().endsWith(`.${extension}`)) {
    filename = filename.slice(0, -(extension.length + 1));
  }

  filename = sanitizeFilenameStem(filename, `image-${index}`, 160);
  return extension ? `${filename}.${extension}` : filename;
}
