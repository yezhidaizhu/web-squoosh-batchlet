<div align="center">
  <img src="src/static-build/assets/batchlet-logo.svg" alt="Batchlet" width="88">
  <h1>Batchlet</h1>
  <p>Batch image compression and conversion, powered by Squoosh.</p>
  <p><a href="https://vicoco.uk"><strong>Open Batchlet</strong></a></p>
</div>

![Batchlet editor](src/static-build/assets/batchlet-editor-preview.webp)

Batchlet adds a multi-image workflow to [Squoosh](https://squoosh.app). Queue images, compare codecs and quality, apply the same settings to the whole batch, and export the results as a ZIP.

## Features

- Batch queue for multiple images
- JPEG, PNG, WebP, AVIF, SVG, and more
- Side-by-side quality and file-size comparison
- One set of export settings for the entire batch
- Custom ZIP filename and processing progress
- Local browser processing: images are not uploaded
- Installable PWA

## Use Batchlet

1. Open [vicoco.uk](https://vicoco.uk).
2. Drop or select multiple images.
3. Choose an image and tune the output settings.
4. Start the batch and download the ZIP.

## Privacy

Image compression and conversion run locally in your browser. Your images do not leave your device.

The app uses Google Analytics for basic usage metrics. It does not upload image contents.

## Development

Requires Node.js 22.

```sh
npm install
npm run build
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Batchlet is built on the open-source [Squoosh](https://github.com/GoogleChromeLabs/squoosh) project.

Licensed under the [Apache License 2.0](LICENSE).
