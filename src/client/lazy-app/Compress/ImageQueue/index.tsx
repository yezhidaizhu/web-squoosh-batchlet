import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';

export interface QueueFile {
  id: string;
  file: File;
  previewUrl: string;
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

export default class ImageQueue extends Component<Props> {
  private fileInput?: HTMLInputElement;

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

  render({ files, selectedFileId, collapsed, launcher }: Props) {
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
                  <img class={style.thumbnail} src={file.previewUrl} alt="" />
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
