import type { EncoderState, EncoderType } from '../feature-meta';

export type TargetSizeMode = 'quality' | 'target';
export type TargetSizeUnit = 'kB' | 'MB';

export interface TargetSizeSettings {
  mode: TargetSizeMode;
  value: number;
  unit: TargetSizeUnit;
  allowResize: boolean;
}

export interface TargetSizeResult {
  actualBytes: number;
  targetBytes: number;
  quality: number;
  width: number;
  height: number;
  resized: boolean;
  targetMet: boolean;
}

export interface TargetSizeEncodeResult extends TargetSizeResult {
  file: File;
  image: ImageData;
}

interface EncodeToTargetOptions {
  signal: AbortSignal;
  image: ImageData;
  encoderState: EncoderState;
  targetBytes: number;
  allowResize: boolean;
  encode(image: ImageData, encoderState: EncoderState): Promise<File>;
  resize(image: ImageData, width: number, height: number): Promise<ImageData>;
}

const supportedEncoderTypes: EncoderType[] = [
  'mozJPEG',
  'browserJPEG',
  'webP',
  'avif',
];

export const defaultTargetSizeSettings: TargetSizeSettings = {
  mode: 'quality',
  value: 200,
  unit: 'kB',
  allowResize: false,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

export const normalizeTargetSizeSettings = (
  value: unknown,
): TargetSizeSettings => {
  if (!isObject(value)) return { ...defaultTargetSizeSettings };

  return {
    mode: 'quality',
    value:
      typeof value.value === 'number' && Number.isFinite(value.value)
        ? value.value
        : defaultTargetSizeSettings.value,
    unit: value.unit === 'MB' ? 'MB' : 'kB',
    allowResize: value.allowResize === true,
  };
};

export const targetSizeBytes = (settings: TargetSizeSettings): number =>
  Number.isFinite(settings.value) && settings.value > 0
    ? Math.round(settings.value * (settings.unit === 'MB' ? 1_000_000 : 1_000))
    : 0;

export const encoderSupportsTargetSize = (type: EncoderType): boolean =>
  supportedEncoderTypes.includes(type);

export const encoderStateAtQuality = (
  encoderState: EncoderState,
  quality: number,
): EncoderState => {
  const options: any = { ...encoderState.options };

  switch (encoderState.type) {
    case 'browserJPEG':
      options.quality = quality / 100;
      break;
    case 'mozJPEG':
      options.quality = quality;
      if (options.separate_chroma_quality) options.chroma_quality = quality;
      break;
    case 'webP':
      options.quality = quality;
      options.alpha_quality = quality;
      options.lossless = 0;
      options.target_size = 0;
      options.target_PSNR = 0;
      break;
    case 'avif':
      options.quality = quality;
      options.qualityAlpha = -1;
      break;
  }

  return { ...encoderState, options } as EncoderState;
};

const qualityRange = (encoderState: EncoderState) => ({
  min: 1,
  max: encoderState.type === 'avif' ? 99 : 100,
});

export async function encodeToTargetSize({
  signal,
  image,
  encoderState,
  targetBytes,
  allowResize,
  encode,
  resize,
}: EncodeToTargetOptions): Promise<TargetSizeEncodeResult> {
  const { min, max } = qualityRange(encoderState);
  const encodeAtQuality = async (input: ImageData, quality: number) => {
    if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
    return encode(input, encoderStateAtQuality(encoderState, quality));
  };

  let workingImage = image;
  let resized = false;
  let searchMin = min;
  let smallestFile = await encodeAtQuality(workingImage, min);

  if (smallestFile.size > targetBytes && allowResize) {
    searchMin = Math.min(75, max);
    let scale = 1;
    smallestFile = await encodeAtQuality(workingImage, searchMin);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const estimatedScale = Math.sqrt(targetBytes / smallestFile.size) * 0.96;
      scale *= Math.min(0.9, Math.max(0.1, estimatedScale));
      const width = Math.max(1, Math.floor(image.width * scale));
      const height = Math.max(1, Math.floor(image.height * scale));
      if (width === workingImage.width && height === workingImage.height) break;

      workingImage = await resize(image, width, height);
      resized = true;
      smallestFile = await encodeAtQuality(workingImage, searchMin);
      if (smallestFile.size <= targetBytes || (width === 1 && height === 1)) {
        break;
      }
    }

    if (smallestFile.size > targetBytes) {
      searchMin = min;
      smallestFile = await encodeAtQuality(workingImage, min);
    }
  }

  if (smallestFile.size > targetBytes) {
    return {
      file: smallestFile,
      image: workingImage,
      actualBytes: smallestFile.size,
      targetBytes,
      quality: min,
      width: workingImage.width,
      height: workingImage.height,
      resized,
      targetMet: false,
    };
  }

  const largestFile = await encodeAtQuality(workingImage, max);
  if (largestFile.size <= targetBytes) {
    return {
      file: largestFile,
      image: workingImage,
      actualBytes: largestFile.size,
      targetBytes,
      quality: max,
      width: workingImage.width,
      height: workingImage.height,
      resized,
      targetMet: true,
    };
  }

  let bestFile = smallestFile;
  let bestQuality = searchMin;
  let low = searchMin + 1;
  let high = max - 1;

  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const file = await encodeAtQuality(workingImage, quality);
    if (file.size <= targetBytes) {
      bestFile = file;
      bestQuality = quality;
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }

  return {
    file: bestFile,
    image: workingImage,
    actualBytes: bestFile.size,
    targetBytes,
    quality: bestQuality,
    width: workingImage.width,
    height: workingImage.height,
    resized,
    targetMet: true,
  };
}
