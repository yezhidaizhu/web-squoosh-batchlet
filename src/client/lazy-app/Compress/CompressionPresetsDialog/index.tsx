import { h, Component } from 'preact';

import { AddIcon, EditIcon, ResetIcon, TrashIcon } from 'client/lazy-app/icons';
import { encoderMap } from 'client/lazy-app/feature-meta';
import type {
  CompressionPreset,
  CompressionPresetSettings,
} from '../compression-presets';
import * as style from './style.css';
import 'add-css:./style.css';
import { targetSizeBytes } from '../target-size';
import Toggle from '../Options/Toggle';

interface Props {
  sideIndex: 0 | 1;
  presets: CompressionPreset[];
  currentSettings: CompressionPresetSettings;
  rememberSettings: boolean;
  onClose(): void;
  onApply(id: string): void;
  onCreate(name: string): void;
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
  onRememberSettingsChange(remember: boolean): void;
  onReset(): void;
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
    if (settings.targetSize.mode === 'target') {
      const bytes = targetSizeBytes(settings.targetSize);
      parts.push(
        bytes >= 1_000_000
          ? `${(bytes / 1_000_000).toPrecision(3)} MB max`
          : `${Math.round(bytes / 1_000)} kB max`,
      );
    } else {
      const quality = (encoderState.options as { quality?: number }).quality;
      if (typeof quality === 'number') {
        parts.push(`Q${Math.round(quality <= 1 ? quality * 100 : quality)}`);
      }
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

export default class SettingsDialog extends Component<Props, State> {
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

  private onRememberSettingsChange = (event: Event) => {
    this.props.onRememberSettingsChange(
      (event.currentTarget as HTMLInputElement).checked,
    );
  };

  render(
    {
      sideIndex,
      presets,
      currentSettings,
      rememberSettings,
      onClose,
      onApply,
      onDelete,
      onReset,
    }: Props,
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
          aria-labelledby="editor-settings-title"
          aria-describedby="editor-settings-summary"
          tabIndex={-1}
        >
          <header class={style.header}>
            <div class={style.headerTitle}>
              <h2 id="editor-settings-title">Settings</h2>
              <span>{sideIndex === 0 ? 'Left side' : 'Right side'}</span>
            </div>
            <button type="button" aria-label="Close settings" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <span id="editor-settings-summary" class={style.visuallyHidden}>
            Manage remembered settings and compression presets.
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
              <label class={style.rememberSetting}>
                <span class={style.rememberCopy}>
                  <strong>Remember settings</strong>
                  <small>
                    Use this side's current settings the next time you open the
                    editor.
                  </small>
                </span>
                <Toggle
                  checked={rememberSettings}
                  aria-label={`Remember ${
                    sideIndex === 0 ? 'left' : 'right'
                  } side settings`}
                  onChange={this.onRememberSettingsChange}
                />
              </label>
              <div class={style.sectionHeader}>
                <div>
                  <h3>Compression presets</h3>
                  <span>
                    {presets.length}{' '}
                    {presets.length === 1 ? 'preset' : 'presets'}
                  </span>
                </div>
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
              <button class={style.resetButton} type="button" onClick={onReset}>
                <ResetIcon />
                <span>Reset settings</span>
              </button>
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
