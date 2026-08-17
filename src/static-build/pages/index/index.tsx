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
import { themeInitScript } from 'shared/theme';

interface Props {}

const googleTagInitScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-YS3QJJ1B9D');
`;

const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Vicoco',
      url: siteOrigin,
      image: `${siteOrigin}${ogImage}`,
      description:
        'Batch compress and convert JPEG, PNG, WebP and AVIF images locally with Squoosh. Compare quality and file size, then export the whole batch as a ZIP.',
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
          name: 'How do I batch compress multiple images at once?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Add images or a folder, choose an output format, quality and resize settings, then process the queue and download the compressed images as a ZIP.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I batch convert images to WebP or AVIF?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Choose WebP or AVIF as the output format, tune the quality and export all queued images together as a ZIP.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which image formats can I compress and convert?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can add common formats including JPEG, PNG, WebP, AVIF and SVG, then choose a supported output codec for the batch.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are my images uploaded to a server?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Image processing runs locally in your browser, so your files stay on your device.',
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
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-YS3QJJ1B9D"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(googleTagInitScript),
        }}
      />
      <title>Squoosh Batch Image Compressor | Vicoco</title>
      <meta
        name="description"
        content="Batch compress and convert JPEG, PNG, WebP and AVIF images locally with Squoosh. Compare quality and file size, then export the whole batch as a ZIP."
      />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta property="og:site_name" content="Vicoco" />
      <meta property="og:url" content={siteOrigin} />
      <meta
        property="og:title"
        content="Squoosh Batch Image Compressor | Vicoco"
      />
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
        content="Batch compress and convert JPEG, PNG, WebP and AVIF images locally with Squoosh. Compare quality and file size, then export the whole batch as a ZIP."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Squoosh Batch Image Compressor | Vicoco"
      />
      <meta
        name="twitter:description"
        content="Batch compress and convert JPEG, PNG, WebP and AVIF images locally with Squoosh. Compare quality and file size, then export the whole batch as a ZIP."
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
      <meta name="theme-color" content="#ffffff" />
      <script
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(themeInitScript),
        }}
      />
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
