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
import favicon from 'url:static-build/assets/favicon.ico';
import ogImage from 'url:static-build/assets/batchlet-editor-preview.webp';
import { escapeStyleScriptContent, siteOrigin } from 'static-build/utils';
import BatchletHome from 'shared/BatchletHome';

interface Props {}

const Index: FunctionalComponent<Props> = () => (
  <html lang="en">
    <head>
      <title>
        Squoosh Batch Image Compressor - Compress Images &amp; Codec Comparison
        | Batchlet
      </title>
      <meta
        name="description"
        content="Batchlet adds a Squoosh batch workflow for image compression, codec comparison, conversion and optimization of multiple images locally in your browser."
      />
      <meta name="twitter:card" content="summary" />
      <meta
        property="og:title"
        content="Squoosh Batch Image Compressor | Batchlet"
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
        content="A Squoosh batch workflow for image compression, comparison, conversion and optimization of multiple images locally in your browser."
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="shortcut icon" href={favicon} />
      <link rel="apple-touch-icon" href={ogImage} />
      <meta name="theme-color" content="#ff3385" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="canonical" href={siteOrigin} />
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
