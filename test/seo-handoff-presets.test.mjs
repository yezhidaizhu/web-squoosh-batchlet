import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import test from 'node:test';

import {
  getSeoHandoffPreset,
  imageHandoffUrlAfterConsumption,
  parseImageHandoffUrl,
  partitionHandoffFiles,
} from '../src/client/initial-app/seo-handoff-presets.ts';

const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const jpegBytes = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
  'base64',
);

test('parses source before URL cleanup and only maps known sources', () => {
  const request = parseImageHandoffUrl(
    'https://vicoco.uk/handoff?handoff=db-id&source=png-to-webp',
  );
  assert.equal(request?.id, 'db-id');
  assert.equal(request?.source, 'png-to-webp');
  assert.equal(request?.preset?.output, 'webP');
  assert.equal(getSeoHandoffPreset('webP'), undefined);
  assert.equal(getSeoHandoffPreset('unknown-source'), undefined);
  assert.equal(getSeoHandoffPreset('toString'), undefined);
  assert.equal(getSeoHandoffPreset('__proto__'), undefined);
});

test('maps every SEO source to the intended preset', () => {
  for (const source of [
    'ru-szhat-jpg',
    'vi-nen-anh-jpg',
    'th-reduce-jpg-size',
    'id-kompres-jpg',
    'it-comprimi-jpg',
  ]) {
    assert.equal(getSeoHandoffPreset(source)?.output, 'mozJPEG');
  }
  for (const source of [
    'vi-nen-anh-png',
    'tr-png-kucultme',
    'id-kompres-png',
    'fr-compresser-png',
  ]) {
    const preset = getSeoHandoffPreset(source);
    assert.equal(preset?.output, 'oxiPNG');
    assert.equal(preset?.enableQuantize, true);
  }
  for (const source of ['image-stretcher', 'es-redimensionar-imagen']) {
    assert.equal(getSeoHandoffPreset(source)?.enableResize, true);
  }
  for (const source of [
    'image-size-checker',
    'ru-szhat-foto',
    'zh-tw-image-compressor',
    'id-kompres-foto',
  ]) {
    assert.equal(getSeoHandoffPreset(source)?.output, undefined);
  }
});

test('real PNG selects WebP and rejects a real JPEG', async () => {
  const png = new File([pngBytes], 'pixel.png', { type: 'image/png' });
  const jpeg = new File([jpegBytes], 'pixel.jpg', { type: 'image/jpeg' });
  const preset = getSeoHandoffPreset('png-to-webp');
  const result = await partitionHandoffFiles([png, jpeg], preset);
  assert.equal(preset?.output, 'webP');
  assert.deepEqual(result.accepted, [png]);
  assert.deepEqual(result.rejected, [jpeg]);
});

test('real JPEG selects stable JPEG for the whole batch', async () => {
  const first = new File([jpegBytes], 'first.jpg', { type: 'image/jpeg' });
  const second = new File([jpegBytes], 'second.jpeg', { type: 'image/jpeg' });
  const preset = getSeoHandoffPreset('ru-szhat-jpg');
  const result = await partitionHandoffFiles([first, second], preset);
  assert.equal(preset?.output, 'mozJPEG');
  assert.deepEqual(result.accepted, [first, second]);
  assert.deepEqual(result.rejected, []);
});

test('real PNG selects stable PNG with palette and dithering enabled', async () => {
  const png = new File([pngBytes], 'pixel.png', { type: 'image/png' });
  const preset = getSeoHandoffPreset('fr-compresser-png');
  const result = await partitionHandoffFiles([png], preset);
  assert.equal(preset?.output, 'oxiPNG');
  assert.equal(preset?.enableQuantize, true);
  assert.deepEqual(result.accepted, [png]);
});

test('ordinary entry and consumed URLs do not reapply a preset', () => {
  assert.equal(parseImageHandoffUrl('https://vicoco.uk/'), undefined);
  const cleaned = imageHandoffUrlAfterConsumption(
    'https://vicoco.uk/handoff?handoff=db-id&source=image-stretcher',
  );
  assert.equal(cleaned, '/');
  assert.equal(parseImageHandoffUrl(`https://vicoco.uk${cleaned}`), undefined);
});
