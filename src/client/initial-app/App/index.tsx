import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/snack-bar';
import BatchletHome from 'shared/BatchletHome';
import 'shared/custom-els/loading-spinner';
import ImageQueue, { QueueFile } from 'client/lazy-app/Compress/ImageQueue';

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
  Compress?: typeof import('client/lazy-app/Compress').default;
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
  private nextQueueId = 0;

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

  private appendFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    const files = this.uniqueQueueFiles(newFiles, this.state.files);
    if (files.length === 0) {
      this.showSnack('Image already in the queue');
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
      selectedFileId: state.selectedFileId || files[0].id,
    }));
  };

  private replaceFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    const files = this.uniqueQueueFiles(newFiles);
    if (files.length === 0) return;
    this.openEditor();
    this.setState({ files, selectedFileId: files[0].id });
  };

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    if (this.state.isEditorOpen) {
      this.appendFiles(files);
    } else {
      this.replaceFiles(files);
    }
  };

  private onIntroPickFiles = (files: File[]) => this.replaceFiles(files);

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
    return this.snackbar.showSnackbar(message, options);
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

    return (
      <div class={`${style.app} ${!isEditorOpen ? style.appHome : ''}`}>
        <file-drop multiple onfiledrop={this.onFileDrop} class={style.drop}>
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isEditorOpen ? (
            Compress && (
              <div class={style.editor}>
                <Compress
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
                />
              </div>
            )
          ) : (
            <div class={style.home}>
              <BatchletHome onFiles={this.onIntroPickFiles} />
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
