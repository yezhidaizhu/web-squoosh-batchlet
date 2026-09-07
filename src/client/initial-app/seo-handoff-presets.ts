export type SeoHandoffInput = 'png' | 'jpeg';
export type SeoHandoffOutput = 'webP' | 'mozJPEG' | 'oxiPNG';

export interface SeoHandoffPreset {
  source: string;
  input?: SeoHandoffInput;
  output?: SeoHandoffOutput;
  outputExtension?: 'jpeg';
  targetSizeKb?: number;
  allowTargetResize?: boolean;
  enableResize?: boolean;
  enableQuantize?: boolean;
}

export interface ImageHandoffRequest {
  id: string;
  source?: string;
  preset?: SeoHandoffPreset;
}

const preset = (
  source: string,
  settings: Omit<SeoHandoffPreset, 'source'> = {},
): SeoHandoffPreset => ({ source, ...settings });

const seoHandoffPresets: Readonly<Record<string, SeoHandoffPreset>> = {
  'png-to-webp': preset('png-to-webp', { input: 'png', output: 'webP' }),
  'image-size-checker': preset('image-size-checker'),
  'image-stretcher': preset('image-stretcher', { enableResize: true }),
  'es-redimensionar-imagen': preset('es-redimensionar-imagen', {
    enableResize: true,
  }),
  'ru-szhat-jpg': preset('ru-szhat-jpg', { input: 'jpeg', output: 'mozJPEG' }),
  'vi-nen-anh-jpg': preset('vi-nen-anh-jpg', {
    input: 'jpeg',
    output: 'mozJPEG',
  }),
  'th-reduce-jpg-size': preset('th-reduce-jpg-size', {
    input: 'jpeg',
    output: 'mozJPEG',
  }),
  'id-kompres-jpg': preset('id-kompres-jpg', {
    input: 'jpeg',
    output: 'mozJPEG',
  }),
  'it-comprimi-jpg': preset('it-comprimi-jpg', {
    input: 'jpeg',
    output: 'mozJPEG',
  }),
  'vi-nen-anh-png': preset('vi-nen-anh-png', {
    input: 'png',
    output: 'oxiPNG',
    enableQuantize: true,
  }),
  'tr-png-kucultme': preset('tr-png-kucultme', {
    input: 'png',
    output: 'oxiPNG',
    enableQuantize: true,
  }),
  'id-kompres-png': preset('id-kompres-png', {
    input: 'png',
    output: 'oxiPNG',
    enableQuantize: true,
  }),
  'fr-compresser-png': preset('fr-compresser-png', {
    input: 'png',
    output: 'oxiPNG',
    enableQuantize: true,
  }),
  'ru-szhat-foto': preset('ru-szhat-foto'),
  'zh-tw-image-compressor': preset('zh-tw-image-compressor'),
  'id-kompres-foto': preset('id-kompres-foto'),
  'image-compressor-to-20kb': preset('image-compressor-to-20kb', {
    output: 'mozJPEG',
    targetSizeKb: 20,
    allowTargetResize: false,
  }),
  'image-compressor-to-50kb': preset('image-compressor-to-50kb', {
    output: 'mozJPEG',
    targetSizeKb: 50,
    allowTargetResize: false,
  }),
  'image-compressor-to-100kb': preset('image-compressor-to-100kb', {
    output: 'mozJPEG',
    targetSizeKb: 100,
    allowTargetResize: false,
  }),
  'image-compressor-to-200kb': preset('image-compressor-to-200kb', {
    output: 'mozJPEG',
    targetSizeKb: 200,
    allowTargetResize: false,
  }),
  'image-compressor-to-500kb': preset('image-compressor-to-500kb', {
    output: 'mozJPEG',
    targetSizeKb: 500,
    allowTargetResize: false,
  }),
  'jpg-to-jpeg': preset('jpg-to-jpeg', {
    input: 'jpeg',
    output: 'mozJPEG',
    outputExtension: 'jpeg',
  }),
};

export const getSeoHandoffPreset = (
  source: string | null | undefined,
): SeoHandoffPreset | undefined =>
  source && Object.prototype.hasOwnProperty.call(seoHandoffPresets, source)
    ? seoHandoffPresets[source]
    : undefined;

export const parseImageHandoffUrl = (
  url: string | URL,
): ImageHandoffRequest | undefined => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  const id = parsed.searchParams.get('handoff');
  if (!id) return;
  const source = parsed.searchParams.get('source') || undefined;
  return { id, source, preset: getSeoHandoffPreset(source) };
};

export const imageHandoffUrlAfterConsumption = (url: string | URL): string => {
  const parsed = typeof url === 'string' ? new URL(url) : new URL(url.href);
  parsed.searchParams.delete('handoff');
  parsed.searchParams.delete('source');
  if (parsed.pathname === '/handoff') parsed.pathname = '/';
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
};

const sniffRestrictedFormat = async (
  file: File,
): Promise<SeoHandoffInput | undefined> => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'jpeg';
  }
  return;
};

export const partitionHandoffFiles = async (
  files: File[],
  preset: SeoHandoffPreset | undefined,
): Promise<{ accepted: File[]; rejected: File[] }> => {
  if (!preset?.input) return { accepted: files, rejected: [] };
  const formats = await Promise.all(files.map(sniffRestrictedFormat));
  return files.reduce(
    (result, file, index) => {
      result[formats[index] === preset.input ? 'accepted' : 'rejected'].push(
        file,
      );
      return result;
    },
    { accepted: [] as File[], rejected: [] as File[] },
  );
};
