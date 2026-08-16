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
import type { Theme } from 'shared/theme';
import * as style from './style.css';

interface Props {
  onFiles?: (files: File[], source?: 'paste') => void;
  onDemoFiles?: (files: File[]) => void;
  onNotice?: (message: string) => unknown;
  theme?: Theme;
  onThemeChange?: () => void;
}

const clipboardExtension = (type: string) => {
  const subtype = type.split('/')[1] || 'png';
  return subtype === 'svg+xml' ? 'svg' : subtype.split('+')[0];
};

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
    size: '10.7 kB',
    previewUrl: iconDemo,
    sourceUrl: iconSource,
    filename: 'squoosh.svg',
    alt: 'Squoosh SVG icon sample image',
  },
];

const BatchletHome: FunctionalComponent<Props> = ({
  onFiles,
  onDemoFiles,
  onNotice,
  theme = 'light',
  onThemeChange,
}) => {
  const input = useRef<HTMLInputElement | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);
  const uploadActions = useRef<HTMLDivElement | null>(null);
  const folderMenuButton = useRef<HTMLButtonElement | null>(null);
  const workspace = useRef<HTMLElement | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<
    BeforeInstallPromptEvent | undefined
  >(undefined);

  useEffect(() => {
    const closeFolderMenu = (event: PointerEvent) => {
      if (!uploadActions.current?.contains(event.target as Node)) {
        setFolderMenuOpen(false);
      }
    };
    const closeFolderMenuWithKeyboard = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        folderMenuButton.current?.getAttribute('aria-expanded') !== 'true'
      )
        return;
      setFolderMenuOpen(false);
      folderMenuButton.current?.focus();
    };
    document.addEventListener('pointerdown', closeFolderMenu);
    document.addEventListener('keydown', closeFolderMenuWithKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeFolderMenu);
      document.removeEventListener('keydown', closeFolderMenuWithKeyboard);
    };
  }, []);

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

  const chooseImagesFromStage = (event: Event) => {
    if (uploadActions.current?.contains(event.target as Node)) return;
    chooseImages(event);
  };

  const pasteImages = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!navigator.clipboard?.read) {
      onNotice?.(
        'Clipboard access is unavailable. Press Cmd/Ctrl + V to paste',
      );
      return;
    }

    let items: ClipboardItem[];
    try {
      items = await navigator.clipboard.read();
    } catch (_) {
      onNotice?.('Clipboard access was blocked. Press Cmd/Ctrl + V to paste');
      return;
    }

    const files: File[] = [];
    for (const item of items) {
      const type = item.types.find((itemType) => itemType.startsWith('image/'));
      if (!type) continue;
      let blob: Blob;
      try {
        blob = await item.getType(type);
      } catch (_) {
        continue;
      }
      files.push(
        new File(
          [blob],
          `pasted-image-${files.length + 1}.${clipboardExtension(type)}`,
          { type },
        ),
      );
    }

    if (files.length === 0) {
      onNotice?.('No image found in the clipboard');
      return;
    }

    onFiles?.(files, 'paste');
  };

  const chooseFolder = (event: Event) => {
    if (!onFiles) return;
    event.preventDefault();
    setFolderMenuOpen(false);
    folderInput.current?.click();
  };

  const onChooseFiles = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length) onFiles?.(files);
    target.value = '';
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
        onChange={onChooseFiles}
      />
      <input
        class={style.fileInput}
        ref={folderInput}
        type="file"
        multiple
        accept="image/*,.svg"
        webkitdirectory
        onChange={onChooseFiles}
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
              <a href="#contact">Contact</a>
            </div>
            <button
              class={style.themeToggle}
              type="button"
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              aria-pressed={theme === 'dark'}
              title={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              onClick={onThemeChange}
            >
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z" />
                </svg>
              )}
            </button>
            <button class={style.install} type="button" onClick={install}>
              Install
            </button>
          </nav>
        </header>
        <main>
          <section class={style.hero} id="top" aria-labelledby="page-title">
            <div
              class={`${style.uploadStage} ${
                folderMenuOpen ? style.folderMenuOpen : ''
              }`}
              onClick={chooseImagesFromStage}
            >
              <div class={style.uploadInner}>
                <span class={style.uploadIcon} aria-hidden="true">
                  <svg
                    width="56"
                    height="56"
                    viewBox="8 9 32 30"
                    fill="currentColor"
                  >
                    <path d="M25.2486 32.74993c0-3.26666 2.4425-6.13416 5.66541-6.65961.95081-.15503 1.90277-.09332 2.83459.13959v-6.79999c0-1.52002-1.22998-2.75-2.75-2.75h-19c-1.51996 0-2.75 1.22998-2.75 2.75v12c0 1.52002 1.23004 2.75 2.75 2.75h13.40002c-.04999-.22003-.08002-.44-.10999-.66998-.03002-.23004-.04003-.49005-.04003-.76001zm-7.71997-9.19c-.29004-.29004-.77002-.29004-1.06 0l-5.72003 5.71997v-9.84998c0-.69.56-1.25 1.25-1.25h19c.69 0 1.25.56 1.25 1.25v6.19l-5.39001-5.39001c-.28998-.28998-.76996-.28998-1.06 0l-5.79999 5.79999z" />
                    <path d="M38.2486 14.4699c-.41998-.59998-1.04999-1-1.76996-1.13l-18.71002-3.29999c-1.46851-.25903-2.92731.77502-3.19 2.22998l-.51001 2.91003h16.92999c2.34003 0 4.25 1.90997 4.25 4.25v7.40997c.5177.28473 1.05048.65045 1.45001 1.09003l2.01001-11.41003c.13001-.71997-.03998-1.44995-.46002-2.04999z" />
                    <circle cx="19.999" cy="21.09" r=".75" />
                    <path d="M35.3946 28.75481c-.92767-.784-2.1792-1.25488-3.396-1.25488-2.89502 0-5.25 2.35541-5.25 5.24994 0 2.86261 2.38904 5.25006 5.25 5.25006 2.89502 0 5.25-2.35547 5.25-5.25 0-1.54297-.66846-2.99316-1.854-3.99512zm-.86573 4.02088c-.29297.29297-.76758.29297-1.06055 0l-.71973-.71973v3.18945c0 .41406-.33594.75-.75.75s-.75-.33594-.75-.75v-3.18945l-.71973.71973c-.29297.29297-.76758.29297-1.06055 0s-.29297-.76758 0-1.06055l2-2c.28717-.28717.77374-.2868 1.06055 0l2 2c.29298.29297.29298.76758.00001 1.06055z" />
                  </svg>
                </span>
                <h1 id="page-title">
                  <span>Squoosh Batch Image</span>{' '}
                  <span class={style.compressorWord}>Compressor</span>
                </h1>
                <span class={style.uploadCopy}>
                  Drop images or folders here, or{' '}
                  <button
                    class={style.pasteButton}
                    type="button"
                    aria-label="Paste images from clipboard"
                    onClick={pasteImages}
                  >
                    Paste
                  </button>
                  , or click to choose
                </span>
                <div class={style.uploadActions} ref={uploadActions}>
                  <a
                    class={`${style.uploadAction} ${style.uploadActionPrimary}`}
                    href="/editor"
                    onClick={chooseImages}
                  >
                    <span>Choose Images</span>
                  </a>
                  <button
                    class={`${style.uploadAction} ${style.uploadActionSecondary}`}
                    ref={folderMenuButton}
                    type="button"
                    aria-label="More upload options"
                    aria-expanded={folderMenuOpen}
                    aria-haspopup="true"
                    aria-controls="folder-upload-menu"
                    onClick={() => setFolderMenuOpen((open) => !open)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m7 9 5 5 5-5" />
                    </svg>
                  </button>
                  {folderMenuOpen && (
                    <div class={style.uploadMenu} id="folder-upload-menu">
                      <button type="button" onClick={chooseFolder}>
                        <span>Choose Folder</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span class={style.uploadFormats}>
                JPEG, PNG, WebP, AVIF, SVG &amp; more
              </span>
            </div>
            <p class={style.heroDescription}>
              Compress and convert multiple images at once with Squoosh,
              entirely in your browser. Compare quality and file size, apply one
              set of settings, then download the batch as a ZIP.
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
                    Compare codecs, quality, dimensions and file size on the
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
              <h2 id="formats-heading">
                Choose the best format for your batch
              </h2>
              <p>
                Test JPEG, PNG, WebP and AVIF, then choose an output format
                based on quality and file size.
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
              <h2 id="compare-heading">
                Compare quality and file size before export
              </h2>
              <p>
                Preview the selected image before and after compression, then
                adjust the format, quality and dimensions while the output file
                size stays in view.
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
                  <span>How do I batch compress images with Squoosh?</span>
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
                  Vicoco adds batch processing to Squoosh. Add multiple images,
                  choose one set of output settings, then process and download
                  them as a ZIP.
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

          <section
            class={style.contact}
            id="contact"
            aria-labelledby="contact-heading"
          >
            <div class={style.contactCopy}>
              <h2 id="contact-heading">Get in touch</h2>
              <p>I read every message and will get back to you by email.</p>
            </div>
            <a
              class={style.contactLink}
              href="mailto:qimucoco@gmail.com"
              aria-label="Email qimucoco@gmail.com"
            >
              <span>
                <small>Email</small>
                <strong>qimucoco@gmail.com</strong>
              </span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
          </section>
        </main>
        <footer class={style.footer}>
          <span>© 2026 Vicoco</span>
          <nav>
            <a
              href="https://github.com/yezhidaizhu/web-squoosh-batchlet#privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default BatchletHome;
