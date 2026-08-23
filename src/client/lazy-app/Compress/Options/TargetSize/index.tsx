import { h, Component } from 'preact';
import Checkbox from '../Checkbox';
import Expander from '../Expander';
import Select from '../Select';
import Toggle from '../Toggle';
import prettyBytes from '../../Results/pretty-bytes';
import type {
  TargetSizeResult,
  TargetSizeSettings,
  TargetSizeUnit,
} from '../../target-size';
import { targetSizeBytes } from '../../target-size';
import * as optionsStyle from '../style.css';
import * as style from './style.css';
import 'add-css:./style.css';

interface Props {
  index: 0 | 1;
  settings: TargetSizeSettings;
  result?: TargetSizeResult;
  originalBytes?: number;
  loading: boolean;
  onChange(settings: TargetSizeSettings): void;
}

interface State {
  expanded: boolean;
  value: string;
  unit: TargetSizeUnit;
  allowResize: boolean;
  submitError: string;
  applying: boolean;
}

const stateFromSettings = (settings: TargetSizeSettings): State => ({
  expanded: false,
  value: String(settings.value),
  unit: settings.unit,
  allowResize: settings.allowResize,
  submitError: '',
  applying: false,
});

export default class TargetSize extends Component<Props, State> {
  state = stateFromSettings(this.props.settings);

  componentWillReceiveProps(nextProps: Props) {
    const finishedApplying =
      (!!nextProps.result && nextProps.result !== this.props.result) ||
      (this.props.loading && !nextProps.loading);
    if (nextProps.settings !== this.props.settings) {
      this.setState({
        value: String(nextProps.settings.value),
        unit: nextProps.settings.unit,
        allowResize: nextProps.settings.allowResize,
        submitError: '',
        ...(finishedApplying ? { applying: false } : {}),
      });
    } else if (finishedApplying) {
      this.setState({ applying: false });
    }
  }

  private onEnabledChange = (event: Event) => {
    const expanded = (event.currentTarget as HTMLInputElement).checked;
    this.setState({ expanded, submitError: '' });
  };

  private onValueInput = (event: Event) => {
    this.setState({
      value: (event.currentTarget as HTMLInputElement).value,
      submitError: '',
    });
  };

  private onUnitChange = (event: Event) => {
    const unit = (event.currentTarget as HTMLSelectElement).value as
      | 'kB'
      | 'MB';
    const value = Number(this.state.value);
    this.setState({
      unit,
      value:
        this.state.value.trim() === '' || !Number.isFinite(value)
          ? this.state.value
          : String(unit === 'MB' ? value / 1000 : value * 1000),
      submitError: '',
    });
  };

  private onResizeChange = (event: Event) => {
    this.setState({
      allowResize: (event.currentTarget as HTMLInputElement).checked,
      submitError: '',
    });
  };

  private onApply = () => {
    const value = Number(this.state.value);
    if (
      this.props.loading ||
      this.state.applying ||
      this.state.value.trim() === '' ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    const settings: TargetSizeSettings = {
      mode: 'target',
      value,
      unit: this.state.unit,
      allowResize: this.state.allowResize,
    };

    if (
      this.props.originalBytes &&
      targetSizeBytes(settings) > this.props.originalBytes
    ) {
      const originalSize = prettyBytes(this.props.originalBytes);
      this.setState({
        submitError: `Target size cannot exceed the original image size (${originalSize.value} ${originalSize.unit}).`,
      });
      return;
    }

    this.setState({ submitError: '', applying: true });
    this.props.onChange(settings);
  };

  render(
    { index, settings, result, loading }: Props,
    { expanded, value, unit, allowResize, submitError, applying }: State,
  ) {
    const numericValue = Number(value);
    const invalid =
      expanded &&
      (value.trim() === '' ||
        !Number.isFinite(numericValue) ||
        numericValue <= 0);
    const draftMatchesSettings =
      numericValue === settings.value &&
      unit === settings.unit &&
      allowResize === settings.allowResize;
    const currentResult = draftMatchesSettings ? result : undefined;
    const busy = loading || applying;
    let status = '';
    let statusTone = '';

    if (invalid) {
      status = 'Enter a size greater than 0.';
      statusTone = style.error;
    } else if (submitError) {
      status = submitError;
      statusTone = style.error;
    } else if (busy) {
      status = 'Finding the best quality…';
    } else if (currentResult) {
      const size = prettyBytes(currentResult.actualBytes);
      statusTone = currentResult.targetMet ? style.success : style.warning;
      status = currentResult.targetMet
        ? `${size.value} ${size.unit} · Quality updated${
            currentResult.resized
              ? ` · ${currentResult.width}×${currentResult.height}`
              : ''
          }`
        : settings.allowResize
        ? `${size.value} ${size.unit} is the smallest possible result.`
        : `${size.value} ${size.unit} is the smallest result. Enable resizing to go lower.`;
    }

    const controlsId = `target-size-controls-${index}`;

    return (
      <div>
        <label class={optionsStyle.sectionEnabler}>
          Target size
          <Toggle
            name={`target-size-${index}`}
            checked={expanded}
            aria-expanded={expanded}
            aria-controls={controlsId}
            onChange={this.onEnabledChange}
          />
        </label>
        <Expander>
          {expanded ? (
            <div class={style.section} id={controlsId}>
              <div class={style.sizeFields}>
                <input
                  class={style.sizeInput}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step={unit === 'MB' ? '0.1' : '1'}
                  value={value}
                  aria-label="Target size per image"
                  aria-invalid={invalid || !!submitError}
                  onInput={this.onValueInput}
                />
                <Select
                  value={unit}
                  aria-label="Target size unit"
                  onChange={this.onUnitChange}
                >
                  <option value="kB">kB</option>
                  <option value="MB">MB</option>
                </Select>
                <button
                  class={style.applyButton}
                  type="button"
                  disabled={busy || invalid || !!currentResult}
                  aria-label={
                    busy ? 'Applying target size' : 'Apply target size'
                  }
                  aria-busy={busy}
                  onClick={this.onApply}
                >
                  {busy ? (
                    <span class={style.spinner} aria-hidden="true" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
              <p class={style.hint}>
                <span aria-hidden="true">⚠️ </span>
                Finds the highest quality that fits your size limit. Exact size
                isn’t guaranteed.
              </p>
              <label
                class={`${optionsStyle.optionToggle} ${style.resizeToggle}`}
              >
                <span>Allow resizing when needed</span>
                <Checkbox
                  checked={allowResize}
                  onChange={this.onResizeChange}
                />
              </label>
              <div class={`${style.status} ${statusTone}`} aria-live="polite">
                {status}
              </div>
            </div>
          ) : null}
        </Expander>
      </div>
    );
  }
}
