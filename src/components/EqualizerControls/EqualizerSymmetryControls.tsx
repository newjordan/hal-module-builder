import React, { ChangeEvent, useMemo } from 'react';
import {
  EQUALIZER_SYMMETRY_OPTIONS,
  SymmetryMode,
  DEFAULT_SYMMETRY_MODE,
} from '../../config/equalizerSymmetry';
import { resolveSymmetrySegmentCount } from '../../utils/symmetry/RadialSymmetryEngine';

export interface EqualizerSymmetryControlsProps {
  value?: SymmetryMode;
  onChange: (mode: SymmetryMode) => void;
  barCount?: number;
  selectClassName?: string;
  descriptionClassName?: string;
  selectStyle?: React.CSSProperties;
  disabled?: boolean;
  className?: string;
  showDescription?: boolean;
  arcMode?: boolean;
  arcSpan?: number;
}

const DEFAULT_CONTAINER_CLASS = 'frost-flex frost-flex-col frost-gap-1';
const DEFAULT_DESCRIPTION_CLASS =
  'frost-text-xs frost-text-gray-400 frost-leading-snug';

export const EqualizerSymmetryControls: React.FC<
  EqualizerSymmetryControlsProps
> = ({
  value = DEFAULT_SYMMETRY_MODE,
  onChange,
  barCount,
  selectClassName,
  selectStyle,
  descriptionClassName,
  disabled = false,
  className,
  showDescription = true,
  arcMode = false,
  arcSpan,
}) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as SymmetryMode;
    onChange(mode);
  };

  const { normalizedValue, description } = useMemo(() => {
    const active = EQUALIZER_SYMMETRY_OPTIONS.find(
      option => option.value === value
    ) ||
      EQUALIZER_SYMMETRY_OPTIONS[0] || {
        value: DEFAULT_SYMMETRY_MODE,
        label: 'None',
        description: 'Default symmetry mode',
      };

    return {
      normalizedValue: active.value,
      description: active.description,
    };
  }, [value]);

  const segmentSummary = useMemo(() => {
    if (normalizedValue === 'none' || normalizedValue === 'rotate') {
      return null;
    }

    const resolvedBarCount =
      typeof barCount === 'number' && barCount > 0 ? Math.floor(barCount) : 0;
    const sampleLength = resolvedBarCount > 0 ? resolvedBarCount : 512;
    const segments = resolveSymmetrySegmentCount(normalizedValue, sampleLength);

    if (segments <= 1) {
      return null;
    }

    const parts: string[] = [];
    const label =
      normalizedValue === 'mirror'
        ? 'Polar mirror'
        : `${segments}-segment symmetry`;
    parts.push(label);

    if (resolvedBarCount > 0) {
      const uniqueBars = Math.ceil(resolvedBarCount / segments);
      parts.push(`${uniqueBars} unique bars`);
    }

    const canonicalArc = (360 / segments).toFixed(1);
    parts.push(`${canonicalArc}deg canonical arc`);

    if (
      arcMode &&
      typeof arcSpan === 'number' &&
      arcSpan > 0 &&
      arcSpan < 360
    ) {
      parts.push(`${arcSpan.toFixed(1)}deg total arc`);
    }

    return parts.join(' | ');
  }, [normalizedValue, barCount, arcMode, arcSpan]);

  return (
    <div className={`${DEFAULT_CONTAINER_CLASS} ${className ?? ''}`.trim()}>
      <select
        value={normalizedValue}
        onChange={handleChange}
        className={selectClassName}
        style={selectStyle}
        disabled={disabled}
        data-testid='equalizer-symmetry-select'
      >
        {EQUALIZER_SYMMETRY_OPTIONS.map(option => {
          const isDisabled =
            typeof barCount === 'number' &&
            typeof option.minBars === 'number' &&
            barCount < option.minBars;

          return (
            <option
              key={option.value}
              value={option.value}
              disabled={isDisabled}
            >
              {option.label}
            </option>
          );
        })}
      </select>

      {showDescription && description && (
        <p
          className={
            descriptionClassName
              ? descriptionClassName
              : DEFAULT_DESCRIPTION_CLASS
          }
        >
          {description}
        </p>
      )}

      {showDescription && segmentSummary && (
        <p
          className={
            descriptionClassName
              ? descriptionClassName
              : DEFAULT_DESCRIPTION_CLASS
          }
        >
          {segmentSummary}
        </p>
      )}
    </div>
  );
};

export default EqualizerSymmetryControls;
