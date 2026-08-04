import { h, FunctionalComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import logo from 'url:static-build/assets/batchlet-logo.svg';
import largeDemo from 'url:static-build/assets/batchlet-demo-large.webp';
import artworkDemo from 'url:static-build/assets/batchlet-demo-artwork.webp';
import deviceDemo from 'url:static-build/assets/batchlet-demo-device.webp';
import iconDemo from 'url:shared/prerendered-app/Intro/imgs/demos/icon-demo-logo.png';
import largeSource from 'url:shared/prerendered-app/Intro/imgs/demos/demo-large-photo.jpg';
import artworkSource from 'url:shared/prerendered-app/Intro/imgs/demos/demo-artwork.jpg';
import deviceSource from 'url:shared/prerendered-app/Intro/imgs/demos/demo-device-screen.png';
import iconSource from 'url:shared/prerendered-app/Intro/imgs/logo.svg';
import preview from 'url:static-build/assets/batchlet-editor-preview.webp';
import * as style from './style.css';

interface Props {
  onFiles?: (files: File[]) => void;
  onDemoFiles?: (files: File[]) => void;
}

const demos = [
  {
    name: 'Large photo',
    size: '2.8MB',
    previewUrl: largeDemo,
    sourceUrl: largeSource,
    filename: 'large-photo.jpg',
    alt: 'Red panda sample image',
  },
  {
    name: 'Artwork',
    size: '2.9MB',
    previewUrl: artworkDemo,
    sourceUrl: artworkSource,
    filename: 'artwork.jpg',
    alt: 'Woman artwork sample image',
  },
  {
    name: 'Device screen',
    size: '1.6MB',
    previewUrl: deviceDemo,
    sourceUrl: deviceSource,
    filename: 'device-screen.png',
    alt: 'Device screen sample image',
  },
  {
    name: 'SVG icon',
    size: '13KB',
    previewUrl: iconDemo,
    sourceUrl: iconSource,
    filename: 'squoosh.svg',
    alt: 'Squoosh SVG icon sample image',
  },
];

const BatchletHome: FunctionalComponent<Props> = ({ onFiles, onDemoFiles }) => {
  const input = useRef<HTMLInputElement | null>(null);
  const workspace = useRef<HTMLElement | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<
    BeforeInstallPromptEvent | undefined
  >(undefined);

  useEffect(() => {
    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (
      !workspace.current ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    setWorkspaceReady(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        requestAnimationFrame(() => setWorkspaceVisible(true));
        observer.disconnect();
      },
      { threshold: 0.28 },
    );
    observer.observe(workspace.current);
    return () => observer.disconnect();
  }, []);

  const chooseImages = (event: Event) => {
    if (!onFiles) return;
    event.preventDefault();
    input.current?.click();
  };

  const onChooseImages = (event: Event) => {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (files.length) onFiles?.(files);
    if (input.current) input.current.value = '';
  };

  const openDemo = async (demo: typeof demos[number], event: Event) => {
    if (!onDemoFiles) return;
    event.preventDefault();
    if (loadingDemo) return;
    setLoadingDemo(demo.filename);
    try {
      const response = await fetch(demo.sourceUrl);
      if (!response.ok) throw new Error('Failed to load demo');
      const file = new File([await response.blob()], demo.filename, {
        type: response.headers.get('content-type') || 'image/webp',
        lastModified: 0,
      });
      onDemoFiles([file]);
    } finally {
      setLoadingDemo(null);
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(undefined);
  };

  return (
    <div class={style.home}>
      <input
        class={style.fileInput}
        ref={input}
        type="file"
        multiple
        accept="image/*,.svg"
        onChange={onChooseImages}
      />
      <div class={style.wrap}>
        <header class={style.header}>
          <a class={style.brand} href="#top">
            <img src={logo} width="34" height="34" alt="vicoco logo" />
            Vicoco
          </a>
          <nav class={style.nav} aria-label="Primary navigation">
            <div class={style.navLinks}>
              <a href="#formats">Formats</a>
              <a href="#faq">FAQ</a>
            </div>
            <button class={style.install} type="button" onClick={install}>
              Install
            </button>
          </nav>
        </header>
        <main>
          <section class={style.hero} id="top" aria-labelledby="page-title">
            <a
              class={style.uploadStage}
              href="/editor"
              onClick={chooseImages}
              aria-label="Drop images or choose images to start a Squoosh batch"
            >
              <div class={style.uploadInner}>
                <span class={style.uploadIcon} aria-hidden="true">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 8 5-5 5 5" />
                    <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                  </svg>
                </span>
                <h1 id="page-title">
                  <span>Squoosh Batch Image</span>{' '}
                  <span class={style.compressorWord}>Compressor</span>
                </h1>
                <span class={style.uploadCopy}>
                  Drop images here, or click to choose
                </span>
                <span class={style.uploadAction}>Choose Images</span>
              </div>
              <span class={style.uploadFormats}>
                JPEG, PNG, WebP, AVIF, SVG &amp; more
              </span>
            </a>
            <p class={style.heroDescription}>
              Compress and convert multiple images with a Squoosh batch
              workflow, all locally in your browser. Compare quality and file
              size, apply one set of settings, then download everything as a
              ZIP.
            </p>
          </section>

          <section class={style.samples} aria-label="Open a sample image">
            <div class={style.sampleIntro}>
              <h2>Try a demo image</h2>
              <p>
                Open one to explore the editor before adding your own files.
              </p>
            </div>
            <ul class={style.sampleGrid}>
              {demos.map((demo, index) => (
                <li>
                  <a
                    href="/editor"
                    onClick={(event) => openDemo(demo, event)}
                    aria-label={`Open ${demo.name} sample, ${demo.size}`}
                    aria-busy={loadingDemo === demo.filename}
                  >
                    <span
                      class={`${style.sampleMedia} ${style.sampleAnimated}`}
                    >
                      <img
                        src={demo.previewUrl}
                        loading={index ? 'lazy' : 'eager'}
                        alt={demo.alt}
                      />
                      {loadingDemo === demo.filename && (
                        <span class={style.sampleLoader} aria-hidden="true" />
                      )}
                    </span>
                    <span class={`${style.sampleSize} ${style.sampleAnimated}`}>
                      {demo.size}
                    </span>
                    <span class={`${style.sampleName} ${style.sampleAnimated}`}>
                      {demo.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section
            ref={workspace}
            class={`${style.workspace} ${
              workspaceReady ? style.workspaceReady : ''
            } ${workspaceVisible ? style.workspaceVisible : ''}`}
            aria-label="Squoosh batch image compression workspace"
          >
            <div class={style.workspaceCopy}>
              <span>Before / after</span>
              <h2>Keep the detail. Lose the weight.</h2>
              <p>Inspect the result before you export a whole batch.</p>
            </div>
            <figure class={style.productShot}>
              <img
                src={preview}
                width="3572"
                height="2192"
                loading="lazy"
                alt="Squoosh batch workspace showing a before-and-after table photograph comparison with WebP settings"
              />
            </figure>
          </section>

          <section class={style.feature} aria-labelledby="batch-heading">
            <img
              src={largeDemo}
              loading="lazy"
              alt="Red panda photograph ready for batch image compression"
            />
            <div>
              <h2 id="batch-heading">
                One set of settings for the whole batch
              </h2>
              <p>
                Tune compression, resize and output settings once, then process
                every image and download the results as a ZIP.
              </p>
              <dl>
                <div>
                  <dt>Queue</dt>
                  <dd>Add multiple images to one local queue.</dd>
                </div>
                <div>
                  <dt>Tune</dt>
                  <dd>
                    Compare codecs, quality, dimensions and output on the
                    selected image.
                  </dd>
                </div>
                <div>
                  <dt>Export</dt>
                  <dd>
                    Apply the current settings to every image and download the
                    results as a ZIP.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            class={style.formats}
            id="formats"
            aria-labelledby="formats-heading"
          >
            <div class={style.formatCopy}>
              <h2 id="formats-heading">Choose codecs for every batch</h2>
              <p>
                Squoosh batch processing lets you compare codecs and keep the
                result only when it earns its file size.
              </p>
            </div>
            <div class={style.formatGrid}>
              <article>
                <img
                  src={largeDemo}
                  loading="lazy"
                  alt="Red panda photograph for JPEG compression"
                />
                <div class={style.formatTileCopy}>
                  <h3>JPEG</h3>
                  <p>Detailed photography with efficient compression.</p>
                </div>
              </article>
              <article>
                <img
                  src={iconDemo}
                  loading="lazy"
                  alt="Graphic sample for PNG compression"
                />
                <div class={style.formatTileCopy}>
                  <h3>PNG</h3>
                  <p>Lossless graphics and transparent edges.</p>
                </div>
              </article>
              <article>
                <img
                  src={deviceDemo}
                  loading="lazy"
                  alt="Device screen sample for WebP conversion"
                />
                <div class={style.formatTileCopy}>
                  <h3>WebP</h3>
                  <p>Modern images with smaller page weight.</p>
                </div>
              </article>
              <article>
                <img
                  src={artworkDemo}
                  loading="lazy"
                  alt="Artwork sample for AVIF conversion"
                />
                <div class={style.formatTileCopy}>
                  <h3>AVIF</h3>
                  <p>High-efficiency output for supported browsers.</p>
                </div>
              </article>
            </div>
          </section>

          <section class={style.compare} aria-labelledby="compare-heading">
            <div>
              <h2 id="compare-heading">Compare every Squoosh batch</h2>
              <p>
                Slide between original and optimized pixels, then adjust the
                codec and quality while the file size stays in view.
              </p>
            </div>
            <figure class={style.compareVisual}>
              <img
                src={preview}
                width="3572"
                height="2192"
                loading="lazy"
                alt="Squoosh batch workspace showing a before-and-after table photograph comparison with WebP settings"
              />
              <figcaption class={style.compareCaption}>
                <span>
                  <b>Inspect</b>Use the divider to check visible detail.
                </span>
                <span>
                  <b>Adjust</b>Test quality, resize and codec settings.
                </span>
                <span>
                  <b>Export</b>Keep the result only when it is ready.
                </span>
              </figcaption>
            </figure>
          </section>

          <section class={style.faq} id="faq" aria-labelledby="faq-heading">
            <h2 id="faq-heading">Squoosh batch FAQ</h2>
            <div class={style.faqList}>
              <details>
                <summary>
                  <span class={style.faqIndex}>01</span>
                  <span>Can Squoosh compress multiple images at once?</span>
                  <span class={style.faqIcon} aria-hidden="true">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p>
                  Yes. Vicoco adds a batch queue to the Squoosh workflow, so you
                  can add multiple images, choose one set of output settings and
                  download the results as a ZIP.
                </p>
              </details>
              <details>
                <summary>
                  <span class={style.faqIndex}>02</span>
                  <span>Do the same settings apply to every image?</span>
                  <span class={style.faqIcon} aria-hidden="true">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p>
                  Yes. The current codec, quality and resize settings are
                  applied to every queued image during batch export.
                </p>
              </details>
              <details>
                <summary>
                  <span class={style.faqIndex}>03</span>
                  <span>Can I batch convert images to WebP or AVIF?</span>
                  <span class={style.faqIcon} aria-hidden="true">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p>
                  Yes. Choose WebP or AVIF as the output format, tune the
                  quality and export all queued images together as a ZIP.
                </p>
              </details>
              <details>
                <summary>
                  <span class={style.faqIndex}>04</span>
                  <span>Are my images uploaded?</span>
                  <span class={style.faqIcon} aria-hidden="true">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p>
                  No. Image processing runs locally in your browser, so your
                  files stay on your device.
                </p>
              </details>
            </div>
          </section>
        </main>
        <footer class={style.footer}>
          <span>
            Vicoco adds batch processing to the Squoosh workflow. Built on
            Squoosh.
          </span>
          <nav>
            <a
              href="https://github.com/yezhidaizhu/web-squoosh-batchlet#privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <a
              href="https://github.com/yezhidaizhu/web-squoosh-batchlet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Project source
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default BatchletHome;
