import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import { h, Component } from 'preact';
import { zipSync } from 'fflate';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/snack-bar';
import BatchletHome from 'shared/BatchletHome';
import 'shared/custom-els/loading-spinner';
import ImageQueue, { QueueFile } from 'client/lazy-app/Compress/ImageQueue';
import type Compress from 'client/lazy-app/Compress';

const ROUTE_EDITOR = '/editor';

const compressPromise = import('client/lazy-app/Compress');
const swBridgePromise = import('client/lazy-app/sw-bridge');

function back() {
  window.history.back();
}

interface Props {}

interface State {
  awaitingShareTarget: boolean;
  files: QueueFile[];
  selectedFileId?: string;
  queueCollapsed: boolean;
  isEditorOpen: boolean;
  batchProgress?: { current: number; total: number };
  batchStopping?: boolean;
  Compress?: typeof import('client/lazy-app/Compress').default;
}

interface DropEntry {
  isDirectory: boolean;
  isFile: boolean;
  file?: (success: (file: File) => void, error: () => void) => void;
  createReader?: () => {
    readEntries: (
      success: (entries: DropEntry[]) => void,
      error: () => void,
    ) => void;
  };
}

interface DropItem {
  kind: string;
  type: string;
  webkitGetAsEntry?: () => DropEntry | null;
}

export default class App extends Component<Props, State> {
  state: State = {
    awaitingShareTarget: new URL(location.href).searchParams.has(
      'share-target',
    ),
    isEditorOpen: false,
    files: [],
    selectedFileId: undefined,
    queueCollapsed: false,
    Compress: undefined,
  };

  snackbar?: SnackBarElement;
  private compress?: Compress;
  private batchAbortController?: AbortController;
  private nextQueueId = 0;
  private directoryDragDepth = 0;

  constructor() {
    super();

    compressPromise
      .then((module) => {
        this.setState({ Compress: module.default });
      })
      .catch(() => {
        this.showSnack('Failed to load app');
      });

    swBridgePromise.then(async ({ offliner, getSharedImage }) => {
      offliner(this.showSnack);
      if (!this.state.awaitingShareTarget) return;
      const file = await getSharedImage();
      // Remove the ?share-target from the URL
      history.replaceState('', '', '/');
      this.replaceFiles([file]);
      this.setState({ awaitingShareTarget: false });
    });

    // Since iOS 10, Apple tries to prevent disabling pinch-zoom. This is great in theory, but
    // really breaks things on Squoosh, as you can easily end up zooming the UI when you mean to
    // zoom the image. Once you've done this, it's really difficult to undo. Anyway, this seems to
    // prevent it.
    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPopState);
  }

  private fingerprintFile = (file: File) =>
    `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

  private createQueueFiles = (files: File[]): QueueFile[] =>
    files.map((file) => ({
      id: `image-${this.nextQueueId++}`,
      file,
      fingerprint: this.fingerprintFile(file),
    }));

  private uniqueQueueFiles = (
    newFiles: File[],
    existingFiles: QueueFile[] = [],
  ) => {
    const fingerprints = new Set(existingFiles.map((file) => file.fingerprint));
    const queueFiles = this.createQueueFiles(newFiles);
    return queueFiles.filter((queueFile) => {
      if (fingerprints.has(queueFile.fingerprint)) return false;
      fingerprints.add(queueFile.fingerprint);
      return true;
    });
  };

  private supportedImageFiles = (files: File[]) =>
    files.filter(
      (file) => file.type.startsWith('image/') || /\.svg$/i.test(file.name),
    );

  private readDropEntry = async (entry: DropEntry): Promise<File[]> => {
    if (entry.isFile && entry.file) {
      return new Promise((resolve) =>
        entry.file!(
          (file) => resolve([file]),
          () => resolve([]),
        ),
      );
    }
    if (!entry.isDirectory || !entry.createReader) return [];

    const reader = entry.createReader();
    const entries: DropEntry[] = [];
    while (true) {
      const batch = await new Promise<DropEntry[]>((resolve) =>
        reader.readEntries(resolve, () => resolve([])),
      );
      if (batch.length === 0) break;
      entries.push(...batch);
    }
    const nestedFiles = await Promise.all(entries.map(this.readDropEntry));
    return nestedFiles.reduce<File[]>(
      (files, nested) => files.concat(nested),
      [],
    );
  };

  private droppedDirectories = (dataTransfer?: DataTransfer | null) => {
    const items = Array.from(
      dataTransfer?.items || [],
    ) as unknown as DropItem[];
    return items
      .map((item) => item.webkitGetAsEntry && item.webkitGetAsEntry())
      .filter((entry): entry is DropEntry => !!entry && entry.isDirectory);
  };

  private mayContainDirectory = (dataTransfer?: DataTransfer | null) => {
    const items = Array.from(
      dataTransfer?.items || [],
    ) as unknown as DropItem[];
    return (
      this.droppedDirectories(dataTransfer).length > 0 ||
      items.some((item) => item.kind === 'file' && item.type === '')
    );
  };

  private onDirectoryDragEnter = (event: DragEvent) => {
    if (!this.mayContainDirectory(event.dataTransfer)) return;
    this.directoryDragDepth += 1;
    (event.currentTarget as HTMLElement).classList.add('drop-directory');
  };

  private onDirectoryDragLeave = (event: DragEvent) => {
    if (this.directoryDragDepth === 0) return;
    this.directoryDragDepth -= 1;
    if (this.directoryDragDepth === 0) {
      (event.currentTarget as HTMLElement).classList.remove('drop-directory');
    }
  };

  private onDirectoryDrop = async (event: DragEvent) => {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drop-directory');
    this.directoryDragDepth = 0;
    const directories = this.droppedDirectories(event.dataTransfer);
    if (directories.length === 0) return;

    const nestedFiles = await Promise.all(directories.map(this.readDropEntry));
    const files = nestedFiles.reduce<File[]>(
      (all, nested) => all.concat(nested),
      [],
    );
    const images = this.supportedImageFiles(files);
    if (images.length === 0) {
      this.showSnack('No image files found in folder');
      return;
    }
    this.appendFiles(images);
  };

  private appendFiles = (newFiles: File[]) => {
    const supportedFiles = this.supportedImageFiles(newFiles);
    if (supportedFiles.length === 0) {
      this.showSnack('Add image files only');
      return;
    }
    if (supportedFiles.length !== newFiles.length) {
      this.showSnack('Skipped unsupported files');
    }
    const files = this.uniqueQueueFiles(supportedFiles, this.state.files);
    if (files.length === 0) {
      const existingFile = supportedFiles
        .map((file) => this.fingerprintFile(file))
        .map((fingerprint) =>
          this.state.files.find((file) => file.fingerprint === fingerprint),
        )
        .find((file): file is QueueFile => !!file);
      if (existingFile) {
        this.openEditor();
        this.setState({ selectedFileId: existingFile.id });
      }
      return;
    }
    this.openEditor();
    this.setState((state) => ({
      files: [
        ...state.files,
        ...files.filter(
          (file) =>
            !state.files.some(
              ({ fingerprint }) => fingerprint === file.fingerprint,
            ),
        ),
      ],
      selectedFileId: files[0].id,
    }));
  };

  private replaceFiles = (newFiles: File[]) => {
    const supportedFiles = this.supportedImageFiles(newFiles);
    if (supportedFiles.length === 0) {
      this.showSnack('Add image files only');
      return;
    }
    if (supportedFiles.length !== newFiles.length) {
      this.showSnack('Skipped unsupported files');
    }
    const files = this.uniqueQueueFiles(supportedFiles);
    if (files.length === 0) return;
    this.openEditor();
    this.setState({ files, selectedFileId: files[0].id });
  };

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    this.appendFiles(files);
  };

  private onIntroPickFiles = (files: File[]) => this.appendFiles(files);

  private onSelectFile = (id: string) => this.setState({ selectedFileId: id });

  private onRemoveFile = (id: string) => {
    const index = this.state.files.findIndex((file) => file.id === id);
    if (index === -1) return;

    const files = this.state.files.filter((file) => file.id !== id);

    if (files.length === 0) {
      this.setState({ files, selectedFileId: undefined }, back);
      return;
    }

    const selectedFileId =
      id === this.state.selectedFileId
        ? (files[index] || files[index - 1]).id
        : this.state.selectedFileId;
    this.setState({ files, selectedFileId });
  };

  private onQueueCollapsedChange = (queueCollapsed: boolean) =>
    this.setState({ queueCollapsed });

  private downloadZip = async (files: File[]) => {
    const entries: { [name: string]: Uint8Array } = {};
    const names = new Set<string>();

    for (const file of files) {
      const extension = file.name.lastIndexOf('.');
      const base = extension === -1 ? file.name : file.name.slice(0, extension);
      const suffix = extension === -1 ? '' : file.name.slice(extension);
      let name = file.name;
      let copy = 2;
      while (names.has(name)) name = `${base}-${copy++}${suffix}`;
      names.add(name);
      entries[name] = new Uint8Array(await file.arrayBuffer());
    }

    const archive = new Blob([zipSync(entries, { level: 6 })], {
      type: 'application/zip',
    });
    const url = URL.createObjectURL(archive);
    const download = document.createElement('a');
    download.href = url;
    download.download = 'batchlet-images.zip';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  private onBatch = async () => {
    if (
      !this.compress ||
      this.state.batchProgress ||
      this.state.files.length === 0
    )
      return;

    const queueFiles = this.state.files;
    const controller = new AbortController();
    this.batchAbortController = controller;
    this.setState({
      batchProgress: { current: 0, total: queueFiles.length },
      batchStopping: false,
    });
    try {
      const outputFiles = await this.compress.processBatch(
        queueFiles.map(({ file }) => file),
        (index, total) =>
          this.setState({
            selectedFileId: queueFiles[index].id,
            batchProgress: { current: index + 1, total },
          }),
        controller.signal,
      );
      await this.downloadZip(outputFiles);
      this.showSnack(`Downloaded ${outputFiles.length} optimized images`);
    } catch (error) {
      if ((error as Error).name === 'AbortError')
        this.showSnack('Batch stopped');
      else this.showSnack(`Batch processing failed: ${error}`);
    } finally {
      if (this.batchAbortController === controller) {
        this.batchAbortController = undefined;
        this.setState({ batchProgress: undefined, batchStopping: false });
      }
    }
  };

  private onStopBatch = () => {
    if (!this.batchAbortController || this.state.batchStopping) return;
    this.setState({ batchStopping: true });
    this.batchAbortController.abort();
  };

  private onClearQueue = async () => {
    const snapshot = this.state;
    const wasEditorOpen = snapshot.isEditorOpen;
    if (wasEditorOpen) history.replaceState(null, '', '/');
    this.setState({
      files: [],
      selectedFileId: undefined,
      queueCollapsed: false,
      isEditorOpen: false,
    });

    const result = await this.showSnack('Queue cleared', {
      timeout: 5000,
      actions: ['undo', 'dismiss'],
    });
    if (result !== 'undo') return;

    if (wasEditorOpen) {
      const editorURL = new URL(location.href);
      editorURL.pathname = ROUTE_EDITOR;
      history.pushState(null, '', editorURL.href);
    }
    this.setState({
      files: snapshot.files,
      selectedFileId: snapshot.selectedFileId,
      queueCollapsed: snapshot.queueCollapsed,
      isEditorOpen: wasEditorOpen,
    });
  };

  private onOpenSavedQueue = () => {
    if (this.state.files.length === 0) return;
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true, queueCollapsed: false });
  };

  private showSnack = (
    message: string,
    options: SnackOptions = {},
  ): Promise<string> => {
    if (!this.snackbar) throw Error('Snackbar missing');
    const resolvedOptions =
      options.timeout === undefined && options.actions === undefined
        ? { ...options, timeout: 3500, actions: [] }
        : options;
    return this.snackbar.showSnackbar(message, resolvedOptions);
  };

  private onPopState = () => {
    this.setState({ isEditorOpen: location.pathname === ROUTE_EDITOR });
  };

  private openEditor = () => {
    if (this.state.isEditorOpen) return;
    // Change path, but preserve query string.
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true });
  };

  render(
    {}: Props,
    {
      files,
      selectedFileId,
      queueCollapsed,
      isEditorOpen,
      Compress,
      awaitingShareTarget,
    }: State,
  ) {
    const selectedFile = files.find((file) => file.id === selectedFileId);
    const showSpinner =
      awaitingShareTarget || (isEditorOpen && (!Compress || !selectedFile));
    const { batchProgress, batchStopping } = this.state;

    return (
      <div class={`${style.app} ${!isEditorOpen ? style.appHome : ''}`}>
        <file-drop
          accept="image/*"
          multiple
          onDragEnter={this.onDirectoryDragEnter}
          onDragLeave={this.onDirectoryDragLeave}
          onDrop={this.onDirectoryDrop}
          onfiledrop={this.onFileDrop}
          class={style.drop}
        >
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isEditorOpen ? (
            Compress && (
              <div class={style.editor}>
                <Compress
                  ref={(compress) => {
                    this.compress = compress || undefined;
                  }}
                  file={selectedFile!.file}
                  showSnack={this.showSnack}
                  onBack={back}
                />
                <ImageQueue
                  files={files}
                  selectedFileId={selectedFileId!}
                  collapsed={queueCollapsed}
                  onCollapsedChange={this.onQueueCollapsedChange}
                  onAddFiles={this.appendFiles}
                  onSelectFile={this.onSelectFile}
                  onRemoveFile={this.onRemoveFile}
                  onBatch={this.onBatch}
                  onClear={this.onClearQueue}
                  batchProgress={batchProgress}
                />
                {batchProgress && (
                  <div
                    class={style.batchOverlay}
                    role="status"
                    aria-live="polite"
                  >
                    <div class={style.batchStatus}>
                      <span class={style.batchProgress}>
                        <span class={style.batchSpinner} aria-hidden="true" />
                        <span>
                          Processing {batchProgress.current} /{' '}
                          {batchProgress.total}
                        </span>
                      </span>
                      <button
                        class={style.batchStop}
                        type="button"
                        onClick={this.onStopBatch}
                        disabled={batchStopping}
                      >
                        {batchStopping ? 'Stopping...' : 'Stop'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div class={style.home}>
              <BatchletHome
                onFiles={this.onIntroPickFiles}
                onDemoFiles={this.appendFiles}
              />
              {files.length > 0 && (
                <ImageQueue
                  files={files}
                  selectedFileId={selectedFileId!}
                  collapsed
                  launcher
                  onOpen={this.onOpenSavedQueue}
                  onCollapsedChange={this.onQueueCollapsedChange}
                  onAddFiles={this.appendFiles}
                  onSelectFile={this.onSelectFile}
                  onRemoveFile={this.onRemoveFile}
                />
              )}
            </div>
          )}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
