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
import { h, FunctionalComponent } from 'preact';

import baseCss from 'css:./base.css';
import batchletCss from 'css:../../../shared/BatchletHome/style.css';
import initialCss from 'initial-css:';
import { allSrc } from 'client-bundle:client/initial-app';
import appleTouchIcon from 'url:static-build/assets/icon-large.png';
import ogImage from 'url:static-build/assets/batchlet-editor-preview.webp';
import { escapeStyleScriptContent, siteOrigin } from 'static-build/utils';
import BatchletHome from 'shared/BatchletHome';

interface Props {}

const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Vicoco',
      url: siteOrigin,
      image: `${siteOrigin}${ogImage}`,
      description:
        'A Squoosh batch image compressor for compressing, comparing and converting multiple images locally in your browser.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      browserRequirements:
        'Requires a modern web browser with JavaScript enabled.',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Vicoco?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vicoco adds a Squoosh batch queue for optimizing, comparing and converting multiple images in one session.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I batch compress and optimize JPEG and PNG images?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Add multiple JPEG and PNG images to a Squoosh batch queue for image compression, quality comparison and export.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I batch convert images to WebP or AVIF?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Choose WebP or AVIF output to convert queued images into modern formats and tune quality before export.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Squoosh batch processing run locally?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Squoosh batch processing happens locally in your browser, so images stay on your device.',
          },
        },
      ],
    },
  ],
});

const Index: FunctionalComponent<Props> = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>Vicoco for Squoosh Batch Processing - Image Compressor</title>
      <meta
        name="description"
        content="Vicoco is a Squoosh batch image compressor for local compression, codec comparison and conversion of multiple JPEG, PNG, WebP and AVIF images."
      />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta property="og:site_name" content="Vicoco" />
      <meta property="og:url" content={siteOrigin} />
      <meta property="og:title" content="Vicoco for Squoosh Batch Processing" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${siteOrigin}${ogImage}`} />
      <meta
        property="og:image:secure_url"
        content={`${siteOrigin}${ogImage}`}
      />
      <meta property="og:image:type" content="image/webp" />
      <meta property="og:image:width" content="3572" />
      <meta property="og:image:height" content="2192" />
      <meta
        property="og:image:alt"
        content="Squoosh batch workspace showing a before-and-after image comparison."
      />
      <meta
        property="og:description"
        content="A Squoosh batch image compressor for local compression, codec comparison and conversion of multiple JPEG, PNG, WebP and AVIF images."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Vicoco for Squoosh Batch Processing"
      />
      <meta
        name="twitter:description"
        content="A Squoosh batch image compressor for local compression, codec comparison and conversion of multiple JPEG, PNG, WebP and AVIF images."
      />
      <meta name="twitter:image" content={`${siteOrigin}${ogImage}`} />
      <meta
        name="twitter:image:alt"
        content="Squoosh batch workspace showing a before-and-after image comparison."
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="icon" href="/favicon.png" type="image/png" sizes="96x96" />
      <link rel="apple-touch-icon" href={appleTouchIcon} />
      <meta name="theme-color" content="#ff3385" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="canonical" href={siteOrigin} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(structuredData),
        }}
      />
      <style
        dangerouslySetInnerHTML={{ __html: escapeStyleScriptContent(baseCss) }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(batchletCss),
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(initialCss),
        }}
      />
    </head>
    <body>
      <div id="app">
        <BatchletHome />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(allSrc),
        }}
      />
    </body>
  </html>
);

export default Index;
