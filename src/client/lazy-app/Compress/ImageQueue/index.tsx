import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';

export interface QueueFile {
  id: string;
  file: File;
}

interface Props {
  files: QueueFile[];
  selectedFileId: string;
  collapsed: boolean;
  launcher?: boolean;
  onOpen?: () => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onAddFiles: (files: File[]) => void;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
}

interface State {
  thumbnailUrls: { [id: string]: string };
}

const maxThumbnailDimension = 270;
const thumbnailQuality = 0.7;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(Error('Image decoding failed'));
    };
    image.src = url;
  });
}

async function createThumbnail(file: File): Promise<Blob> {
  const source =
    'createImageBitmap' in window
      ? await createImageBitmap(file)
      : await loadImage(file);

  try {
    const sourceWidth =
      source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const sourceHeight =
      source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    const scale = Math.min(
      1,
      maxThumbnailDimension / Math.max(sourceWidth, sourceHeight),
    );
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw Error('Canvas not initialized');

    canvas.width = width;
    canvas.height = height;
    context.drawImage(source, 0, 0, width, height);

    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(Error('Thumbnail failed'))),
        'image/webp',
        thumbnailQuality,
      ),
    );
  } finally {
    if ('ImageBitmap' in window && source instanceof ImageBitmap) {
      source.close();
    }
  }
}

export default class ImageQueue extends Component<Props, State> {
  state: State = {
    thumbnailUrls: {},
  };

  private fileInput?: HTMLInputElement;
  private generatingThumbnails = new Set<string>();
  private unmounted = false;

  componentDidMount() {
    this.syncThumbnails();
  }

  componentDidUpdate() {
    this.syncThumbnails();
  }

  componentWillUnmount() {
    this.unmounted = true;
    Object.values(this.state.thumbnailUrls).forEach((url) =>
      URL.revokeObjectURL(url),
    );
  }

  private onAddClick = () => this.fileInput!.click();

  private onFileChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    this.props.onAddFiles(files);
  };

  private renderIcon(type: 'add' | 'collapse' | 'expand' | 'delete') {
    if (type === 'add') {
      return <path d="M12 5v14M5 12h14" />;
    }
    if (type === 'collapse') {
      return <path d="m14 5-7 7 7 7" />;
    }
    if (type === 'expand') {
      return <path d="m10 5 7 7-7 7" />;
    }
    return <path d="m5 5 14 14m0-14L5 19" />;
  }

  private icon(type: 'add' | 'collapse' | 'expand' | 'delete') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {this.renderIcon(type)}
      </svg>
    );
  }

  private formatCount = (count: number) => (count > 99 ? '99+' : count);

  private syncThumbnails = () => {
    const currentIds = new Set(this.props.files.map(({ id }) => id));
    const staleThumbnailUrls = Object.keys(this.state.thumbnailUrls).filter(
      (id) => !currentIds.has(id),
    );

    if (staleThumbnailUrls.length > 0) {
      staleThumbnailUrls.forEach((id) =>
        URL.revokeObjectURL(this.state.thumbnailUrls[id]),
      );
      this.setState((state) => {
        const thumbnailUrls = { ...state.thumbnailUrls };
        staleThumbnailUrls.forEach((id) => delete thumbnailUrls[id]);
        return { thumbnailUrls };
      });
    }

    this.props.files.forEach((queueFile) => {
      const { id, file } = queueFile;
      if (this.state.thumbnailUrls[id] || this.generatingThumbnails.has(id)) {
        return;
      }

      this.generatingThumbnails.add(id);
      createThumbnail(file)
        .catch(() => file)
        .then((thumbnail) => URL.createObjectURL(thumbnail))
        .then((url) => {
          this.generatingThumbnails.delete(id);
          if (
            this.unmounted ||
            !this.props.files.some((queueFile) => queueFile.id === id)
          ) {
            URL.revokeObjectURL(url);
            return;
          }
          this.setState((state) => ({
            thumbnailUrls: { ...state.thumbnailUrls, [id]: url },
          }));
        });
    });
  };

  render(
    { files, selectedFileId, collapsed, launcher }: Props,
    { thumbnailUrls }: State,
  ) {
    const isCollapsed = collapsed || launcher;
    const count = this.formatCount(files.length);
    const expandQueue = () => {
      if (launcher) {
        this.props.onOpen!();
      } else {
        this.props.onCollapsedChange(false);
      }
    };

    return (
      <aside
        class={`${style.queue} ${isCollapsed ? style.collapsed : ''} ${
          launcher ? style.launcher : ''
        }`}
        aria-label="Image queue"
      >
        <div class={style.toolbar}>
          <button
            class={style.iconButton}
            type="button"
            aria-label={
              isCollapsed
                ? `Expand image queue, ${files.length} images`
                : 'Collapse image queue'
            }
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand image queue' : 'Collapse image queue'}
            onClick={() =>
              isCollapsed ? expandQueue() : this.props.onCollapsedChange(true)
            }
          >
            {this.icon(isCollapsed ? 'expand' : 'collapse')}
            {isCollapsed && (
              <span class={style.badge} aria-hidden="true">
                {count}
              </span>
            )}
          </button>
          <span class={style.title} aria-hidden={isCollapsed}>
            IMG {count}
          </span>
          <button
            class={`${style.iconButton} ${style.addButton}`}
            type="button"
            aria-label="Add images"
            title="Add images"
            onClick={this.onAddClick}
            tabIndex={isCollapsed ? -1 : 0}
            aria-hidden={isCollapsed}
          >
            {this.icon('add')}
          </button>
          <input
            class={style.fileInput}
            ref={linkRef(this, 'fileInput')}
            type="file"
            multiple
            onChange={this.onFileChange}
          />
        </div>
        <div
          class={style.list}
          role="listbox"
          aria-label="Queued images"
          aria-hidden={isCollapsed}
        >
          {files.map((file, index) => {
            const selected = file.id === selectedFileId;
            const thumbnailUrl = thumbnailUrls[file.id];
            return (
              <div
                key={file.id}
                class={`${style.item} ${selected ? style.activeItem : ''}`}
                role="option"
                aria-selected={selected}
              >
                <button
                  class={style.selectButton}
                  type="button"
                  aria-label={`Select image ${index + 1}`}
                  onClick={() => this.props.onSelectFile(file.id)}
                  tabIndex={isCollapsed ? -1 : 0}
                >
                  {thumbnailUrl ? (
                    <img
                      class={style.thumbnail}
                      src={thumbnailUrl}
                      alt=""
                      decoding="async"
                    />
                  ) : (
                    <span
                      class={style.thumbnailPlaceholder}
                      aria-hidden="true"
                    />
                  )}
                </button>
                <button
                  class={style.removeButton}
                  type="button"
                  aria-label={`Delete image ${index + 1}`}
                  title="Delete image"
                  onClick={() => this.props.onRemoveFile(file.id)}
                  tabIndex={isCollapsed ? -1 : 0}
                >
                  {this.icon('delete')}
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }
}
