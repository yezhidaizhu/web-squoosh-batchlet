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

  filename = filename
    .replace(invalidFilenameCharacters, '-')
    .trim()
    .replace(/[ .]+$/g, '')
    .slice(0, 160);

  if (!filename) filename = `image-${index}`;
  return extension ? `${filename}.${extension}` : filename;
}
