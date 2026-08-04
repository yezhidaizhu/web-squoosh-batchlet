/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { h } from 'preact';

import {
  escapeStyleScriptContent,
  renderPage,
  siteOrigin,
  writeFiles,
} from './utils';
import IndexPage from './pages/index';
import * as iconLargeMaskable from 'img-url:static-build/assets/icon-large-maskable.png';
import * as iconLarge from 'img-url:static-build/assets/icon-large.png';
import * as screenshot1 from 'img-url:static-build/assets/screenshot1.png';
import * as screenshot2 from 'img-url:static-build/assets/screenshot2.jpg';
import * as screenshot3 from 'img-url:static-build/assets/screenshot3.jpg';
import * as screenshot4 from 'img-url:static-build/assets/screenshot4.png';
import * as screenshot5 from 'img-url:static-build/assets/screenshot5.jpg';
import * as screenshot6 from 'img-url:static-build/assets/screenshot6.jpg';
import dedent from 'dedent';
import { lookup as lookupMime } from 'mime-types';

interface Dimensions {
  width: number;
  height: number;
}

const manifestSize = ({ width, height }: Dimensions) => `${width}x${height}`;
const formFactor = ({ width, height }: Dimensions) =>
  width > height ? 'wide' : 'narrow';

const screenshots = [
  screenshot1,
  screenshot2,
  screenshot3,
  screenshot4,
  screenshot5,
  screenshot6,
].map((screenshot) => ({
  src: screenshot.default,
  type: lookupMime(screenshot.default),
  sizes: manifestSize(screenshot),
  form_factor: formFactor(screenshot),
}));

const notFoundCss = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    color: #202124;
    background: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  main { width: min(100%, 560px); }
  strong { color: #ff3385; font-size: 0.875rem; }
  h1 { margin: 12px 0; font-size: 3rem; line-height: 1.05; }
  p { margin: 0 0 28px; color: #5f6368; font-size: 1.05rem; line-height: 1.6; }
  a { color: #fff; background: #202124; display: inline-block; padding: 12px 18px; text-decoration: none; }
  a:hover, a:focus-visible { background: #ff3385; }
  @media (max-width: 480px) { h1 { font-size: 2.25rem; } }
`;

const notFoundPage = (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>Page Not Found | Vicoco</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ff3385" />
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(notFoundCss),
        }}
      />
    </head>
    <body>
      <main>
        <strong>404</strong>
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <a href="/">Back to Vicoco</a>
      </main>
    </body>
  </html>
);

interface Output {
  [outputPath: string]: string;
}

const toOutput: Output = {
  'index.html': renderPage(<IndexPage />),
  '404.html': renderPage(notFoundPage),
  'llms.txt': `# Vicoco

> A free, browser-based batch image compressor and converter built on Squoosh.

Vicoco processes images locally in the browser. Images stay on the user's device and are not uploaded to a server.

## Main resource

- [Squoosh Batch Image Compressor](${siteOrigin}/): Compress and convert multiple images with Squoosh.

## Capabilities

- Add multiple images to a local batch queue.
- Preview the selected image before and after processing.
- Use JPEG, PNG, WebP, AVIF, and SVG images as inputs.
- Apply one set of format, quality, and resize settings to the entire batch.
- Download the processed images together as a ZIP.

## Privacy

- Image processing happens locally in the browser.
- Vicoco does not upload image files for processing.

## Technical details

- Requires a modern browser with JavaScript enabled.
- Built on Squoosh codecs and image-processing tools.
`,
  'robots.txt': `User-agent: *
Allow: /
Sitemap: ${siteOrigin}/sitemap.xml
`,
  'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteOrigin}/</loc>
  </url>
</urlset>
`,
  'manifest.json': JSON.stringify({
    name: 'Vicoco',
    short_name: 'Vicoco',
    start_url: '/?utm_medium=PWA&utm_source=launcher',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fff',
    theme_color: '#ff3385',
    icons: [
      {
        src: iconLarge.default,
        type: lookupMime(iconLarge.default),
        sizes: manifestSize(iconLarge),
      },
      {
        src: iconLargeMaskable.default,
        type: lookupMime(iconLargeMaskable.default),
        sizes: manifestSize(iconLargeMaskable),
        purpose: 'maskable',
      },
    ],
    description:
      'Batch compress, compare and convert images locally in your browser.',
    lang: 'en',
    categories: ['photo', 'productivity', 'utilities'],
    screenshots,
    share_target: {
      action: '/?utm_medium=PWA&utm_source=share-target&share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        files: [
          {
            name: 'file',
            accept: ['image/*'],
          },
        ],
      },
    },
  }),
  _headers: dedent`
    /*
      Cache-Control: no-cache

    # I don't think Rollup is cache-busting files correctly.
    #/c/*
    #  Cache-Control: max-age=31536000

    # COOP+COEP for WebAssembly threads.
    /*
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Opener-Policy: same-origin
  `,
};

writeFiles(toOutput);
