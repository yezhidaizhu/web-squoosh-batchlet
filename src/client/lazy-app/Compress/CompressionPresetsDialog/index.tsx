import { h, Component } from 'preact';

import { AddIcon, EditIcon, TrashIcon } from 'client/lazy-app/icons';
import { encoderMap } from 'client/lazy-app/feature-meta';
import type {
  CompressionPreset,
  CompressionPresetSettings,
} from '../compression-presets';
import * as style from './style.css';
import 'add-css:./style.css';

interface Props {
  sideIndex: 0 | 1;
  presets: CompressionPreset[];
  currentSettings: CompressionPresetSettings;
  onClose(): void;
  onApply(id: string): void;
  onCreate(name: string): void;
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
}

interface State {
  formMode?: 'create' | 'rename';
  editingPresetId?: string;
  presetName: string;
  presetError?: string;
  helpOpen: boolean;
}

const settingsSummary = (settings: CompressionPresetSettings): string => {
  const { encoderState, processorState } = settings;
  const parts: string[] = [];

  if (encoderState) {
    parts.push(encoderMap[encoderState.type].meta.label);
    const quality = (encoderState.options as { quality?: number }).quality;
    if (typeof quality === 'number') {
      parts.push(`Q${Math.round(quality <= 1 ? quality * 100 : quality)}`);
    }
  } else {
    parts.push('Original');
  }

  parts.push(
    processorState.resize.enabled
      ? `${processorState.resize.width}x${processorState.resize.height}`
      : 'Original size',
  );
  return parts.join(' / ');
};

export default class CompressionPresetsDialog extends Component<Props, State> {
  state: State = { presetName: '', helpOpen: false };

  private dialog?: HTMLDivElement;
  private presetNameInput?: HTMLInputElement;
  private previouslyFocused?: HTMLElement;
  private backdropPressed = false;

  componentDidMount() {
    this.previouslyFocused = document.activeElement as HTMLElement;
    document.addEventListener('keydown', this.onDocumentKeyDown);
    requestAnimationFrame(() => this.dialog?.focus());
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onDocumentKeyDown);
    this.previouslyFocused?.focus();
  }

  private onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.state.formMode) this.cancelPresetForm();
      else if (this.state.helpOpen) this.setState({ helpOpen: false });
      else this.props.onClose();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;

    const focusable = Array.from(
      this.dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled)',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  private onBackdropPointerDown = (event: PointerEvent) => {
    this.backdropPressed = event.target === event.currentTarget;
  };

  private onBackdropPointerUp = (event: PointerEvent) => {
    const shouldClose =
      this.backdropPressed && event.target === event.currentTarget;
    this.backdropPressed = false;
    if (shouldClose) this.props.onClose();
  };

  private focusPresetName = () => {
    this.presetNameInput?.focus();
    this.presetNameInput?.select();
  };

  private startCreatePreset = () => {
    const encoderState = this.props.currentSettings.encoderState;
    const name = encoderState
      ? `${encoderMap[encoderState.type].meta.label} preset`
      : 'Original preset';
    this.setState(
      {
        formMode: 'create',
        editingPresetId: undefined,
        presetName: name,
        presetError: undefined,
        helpOpen: false,
      },
      this.focusPresetName,
    );
  };

  private startRenamePreset = (preset: CompressionPreset) => {
    this.setState(
      {
        formMode: 'rename',
        editingPresetId: preset.id,
        presetName: preset.name,
        presetError: undefined,
        helpOpen: false,
      },
      this.focusPresetName,
    );
  };

  private cancelPresetForm = () => {
    this.setState({
      formMode: undefined,
      editingPresetId: undefined,
      presetError: undefined,
    });
  };

  private onPresetNameInput = (event: Event) => {
    this.setState({
      presetName: (event.currentTarget as HTMLInputElement).value,
      presetError: undefined,
    });
  };

  private submitPresetForm = (event: Event) => {
    event.preventDefault();
    const name = this.state.presetName.trim();
    if (!name) {
      this.setState({ presetError: 'Enter a preset name.' });
      return;
    }
    const duplicate = this.props.presets.some(
      (preset) =>
        preset.id !== this.state.editingPresetId &&
        preset.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      this.setState({ presetError: 'Preset names must be unique.' });
      return;
    }

    if (this.state.formMode === 'rename' && this.state.editingPresetId) {
      this.props.onRename(this.state.editingPresetId, name);
    } else {
      this.props.onCreate(name);
    }
    this.cancelPresetForm();
  };

  render(
    { sideIndex, presets, currentSettings, onClose, onApply, onDelete }: Props,
    { formMode, presetName, presetError, helpOpen }: State,
  ) {
    return (
      <div
        class={style.overlay}
        onPointerDown={this.onBackdropPointerDown}
        onPointerUp={this.onBackdropPointerUp}
        onPointerCancel={() => {
          this.backdropPressed = false;
        }}
      >
        <div
          ref={(dialog) => {
            this.dialog = dialog || undefined;
          }}
          class={`${style.dialog} ${
            sideIndex === 0 ? style.leftAccent : style.rightAccent
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compression-presets-title"
          aria-describedby="compression-presets-summary"
          tabIndex={-1}
        >
          <header class={style.header}>
            <div class={style.headerTitle}>
              <h2 id="compression-presets-title">Compression presets</h2>
              <span>
                {presets.length} {presets.length === 1 ? 'preset' : 'presets'}
              </span>
              <button
                class={style.helpToggle}
                type="button"
                title="What do presets save?"
                aria-label="What do presets save?"
                aria-expanded={helpOpen}
                aria-controls="compression-presets-help"
                onClick={() => this.setState({ helpOpen: !helpOpen })}
              >
                <span aria-hidden="true">?</span>
              </button>
            </div>
            <button type="button" aria-label="Close presets" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <span id="compression-presets-summary" class={style.visuallyHidden}>
            Save and reuse compression settings.
          </span>

          {formMode ? (
            <form class={style.form} onSubmit={this.submitPresetForm}>
              <label>
                <span>
                  {formMode === 'rename' ? 'Rename preset' : 'Preset name'}
                </span>
                <input
                  ref={(input) => {
                    this.presetNameInput = input || undefined;
                  }}
                  type="text"
                  value={presetName}
                  maxLength={32}
                  onInput={this.onPresetNameInput}
                  aria-invalid={!!presetError}
                  aria-describedby={
                    presetError ? 'preset-name-error' : undefined
                  }
                />
              </label>
              {presetError && (
                <span class={style.error} id="preset-name-error" role="alert">
                  {presetError}
                </span>
              )}
              <div class={style.formActions}>
                <button type="button" onClick={this.cancelPresetForm}>
                  Cancel
                </button>
                <button type="submit">
                  {formMode === 'rename' ? 'Rename' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div class={style.content}>
              {helpOpen && (
                <div class={style.help} id="compression-presets-help">
                  <p>
                    <strong>Saved:</strong> output format, quality, encoder,
                    resize and palette settings.
                  </p>
                  <p>
                    <strong>Not saved:</strong> images, file naming rules or ZIP
                    name.
                  </p>
                </div>
              )}
              {presets.length ? (
                <ul class={style.list}>
                  {presets.map((preset) => {
                    const active =
                      JSON.stringify(preset.settings) ===
                      JSON.stringify(currentSettings);
                    return (
                      <li
                        key={preset.id}
                        class={active ? style.itemActive : ''}
                      >
                        <button
                          class={style.apply}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onApply(preset.id)}
                        >
                          <strong>{preset.name}</strong>
                          <span>{settingsSummary(preset.settings)}</span>
                        </button>
                        <span class={style.itemActions}>
                          <button
                            type="button"
                            title={`Rename ${preset.name}`}
                            aria-label={`Rename ${preset.name}`}
                            onClick={() => this.startRenamePreset(preset)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            title={`Delete ${preset.name}`}
                            aria-label={`Delete ${preset.name}`}
                            onClick={() => onDelete(preset.id)}
                          >
                            <TrashIcon />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p class={style.empty}>No presets saved yet.</p>
              )}
            </div>
          )}

          {!formMode && (
            <footer class={style.footer}>
              <button type="button" onClick={this.startCreatePreset}>
                <AddIcon />
                <span>Save current settings</span>
              </button>
            </footer>
          )}
        </div>
      </div>
    );
  }
}
