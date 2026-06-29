import React, { useMemo } from 'react';
import { Layer } from '../../types/layer-types';

import DropShadowControls from '../../features/appearance/components/DropShadowControls';

import InnerGlowControls from '../../features/appearance/components/InnerGlowControls';
import InnerShadowControls from '../../features/appearance/components/InnerShadowControls';
import OuterGlowControls from '../../features/appearance/components/OuterGlowControls';

import BevelEmbossControls from '../../features/appearance/components/BevelEmbossControls';
import GlobalLightControls from '../../features/appearance/components/GlobalLightControls';

import { DEFAULT_GLOBAL_LIGHT } from '../../features/appearance/utils/defaults/global-light';
import {
  DEFAULT_INNER_GLOW,
  DEFAULT_OUTER_GLOW,
} from '../../features/appearance/utils/defaults/glow';

import { DEFAULT_BEVEL_EMBOSS } from '../../features/appearance/utils/defaults/bevel';
import {
  DEFAULT_DROP_SHADOW,
  DEFAULT_INNER_SHADOW,
} from '../../features/appearance/utils/defaults/shadow';
import {
  asGradientState,
  buildFillGradientPayload,
  buildStrokeGradientPayload,
} from '../../features/appearance/utils/gradient';
import {
  clamp01,
  clampAngle,
  clampRange,
} from '../../features/appearance/utils/validation';

type FrostTheme = 'frost_light' | 'frost_dark';
type GradientType = NonNullable<Layer['fillGradient']>['type'];

import FillControls from '../../features/appearance/components/FillControls';
import StrokeControls from '../../features/appearance/components/StrokeControls';

type GradientState = {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle: number;
  centerX?: number;
  centerY?: number;
};

interface AppearancePanelProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  theme: FrostTheme;
  className?: string;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  layer,
  onUpdate,
  theme,
  className = '',
}) => {
  const isLight = theme === 'frost_light';

  const fillType = layer.fillType ?? 'none';
  const strokeType = layer.strokeType ?? 'none';
  const strokeWidth = layer.strokeWidth || 0;
  const strokeAlign = layer.strokeAlign || 'center';

  const fillGradientState = useMemo(
    () => asGradientState(layer.fillGradient, true),
    [layer.fillGradient]
  );
  const strokeGradientState = useMemo(
    () => asGradientState(layer.strokeGradient, false),
    [layer.strokeGradient]
  );

  const globalLight = useMemo(
    () => ({ ...DEFAULT_GLOBAL_LIGHT, ...(layer.globalLight ?? {}) }),
    [layer.globalLight]
  );

  const dropShadow = useMemo(() => {
    const base = layer.dropShadow ?? { ...DEFAULT_DROP_SHADOW, enabled: false };
    return { ...DEFAULT_DROP_SHADOW, ...base, enabled: base.enabled ?? false };
  }, [layer.dropShadow]);

  const innerShadow = useMemo(() => {
    const base = layer.innerShadow ?? {
      ...DEFAULT_INNER_SHADOW,
      enabled: false,
    };
    return { ...DEFAULT_INNER_SHADOW, ...base, enabled: base.enabled ?? false };
  }, [layer.innerShadow]);

  const outerGlow = useMemo(() => {
    const base = layer.outerGlow ?? DEFAULT_OUTER_GLOW;
    return { ...DEFAULT_OUTER_GLOW, ...base, enabled: base.enabled ?? false };
  }, [layer.outerGlow]);

  const innerGlow = useMemo(() => {
    const base = layer.innerGlow ?? { ...DEFAULT_INNER_GLOW, enabled: false };
    return { ...DEFAULT_INNER_GLOW, ...base, enabled: base.enabled ?? false };
  }, [layer.innerGlow]);
  const bevelEmboss = useMemo(() => {
    const base = layer.bevelEmboss ?? {
      ...DEFAULT_BEVEL_EMBOSS,
      enabled: false,
    };
    return { ...DEFAULT_BEVEL_EMBOSS, ...base, enabled: base.enabled ?? false };
  }, [layer.bevelEmboss]);

  const containerClass = [
    'appearance-panel',
    isLight
      ? 'frostlight-standard-glass-card'
      : 'frostdark-standard-glass-card',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const commitFillGradient = (
    updates:
      | Partial<GradientState>
      | ((prev: GradientState) => Partial<GradientState>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(fillGradientState) : updates;
    const nextState: GradientState = {
      ...fillGradientState,
      ...nextPartial,
    };

    onUpdate({
      fillType: 'gradient',
      fillGradient: buildFillGradientPayload(nextState),
    });
  };

  const commitStrokeGradient = (
    updates:
      | Partial<GradientState>
      | ((prev: GradientState) => Partial<GradientState>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(strokeGradientState) : updates;
    const nextState: GradientState = {
      ...strokeGradientState,
      ...nextPartial,
    };

    onUpdate({
      strokeType: 'gradient',
      strokeGradient: buildStrokeGradientPayload(nextState),
    });
  };

  const commitGlobalLight = (
    updates:
      | Partial<NonNullable<Layer['globalLight']>>
      | ((
          prev: NonNullable<Layer['globalLight']>
        ) => Partial<NonNullable<Layer['globalLight']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(globalLight) : updates;
    const nextState: NonNullable<Layer['globalLight']> = {
      ...globalLight,
      ...nextPartial,
    };
    onUpdate({ globalLight: nextState });
  };

  const commitDropShadow = (
    updates:
      | Partial<NonNullable<Layer['dropShadow']>>
      | ((
          prev: NonNullable<Layer['dropShadow']>
        ) => Partial<NonNullable<Layer['dropShadow']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(dropShadow) : updates;
    const nextState: NonNullable<Layer['dropShadow']> = {
      ...dropShadow,
      ...nextPartial,
    };
    const sanitized: NonNullable<Layer['dropShadow']> = {
      ...nextState,
      opacity: clamp01(nextState.opacity),
      distance: clampRange(nextState.distance, 0, 1000, dropShadow.distance),
      spread: clampRange(nextState.spread, 0, 100, dropShadow.spread),
      size: clampRange(nextState.size, 0, 1000, dropShadow.size),
      angle: clampAngle(nextState.angle, dropShadow.angle),
    };
    onUpdate({ dropShadow: sanitized });
  };

  const commitInnerShadow = (
    updates:
      | Partial<NonNullable<Layer['innerShadow']>>
      | ((
          prev: NonNullable<Layer['innerShadow']>
        ) => Partial<NonNullable<Layer['innerShadow']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(innerShadow) : updates;
    const nextState: NonNullable<Layer['innerShadow']> = {
      ...innerShadow,
      ...nextPartial,
    };
    const sanitized: NonNullable<Layer['innerShadow']> = {
      ...nextState,
      opacity: clamp01(nextState.opacity),
      distance: clampRange(nextState.distance, 0, 1000, innerShadow.distance),
      spread: clampRange(nextState.spread, 0, 100, innerShadow.spread),
      size: clampRange(nextState.size, 0, 1000, innerShadow.size),
      angle: clampAngle(nextState.angle, innerShadow.angle),
    };
    onUpdate({ innerShadow: sanitized });
  };

  const commitInnerGlow = (
    updates:
      | Partial<NonNullable<Layer['innerGlow']>>
      | ((
          prev: NonNullable<Layer['innerGlow']>
        ) => Partial<NonNullable<Layer['innerGlow']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(innerGlow) : updates;
    const nextState: NonNullable<Layer['innerGlow']> = {
      ...innerGlow,
      ...nextPartial,
    };
    const rangeFallback = innerGlow.range ?? DEFAULT_INNER_GLOW.range ?? 50;
    const jitterFallback = innerGlow.jitter ?? DEFAULT_INNER_GLOW.jitter ?? 0;
    const sanitized: NonNullable<Layer['innerGlow']> = {
      ...nextState,
      opacity: clamp01(nextState.opacity),
      spread: clampRange(nextState.spread, 0, 100, innerGlow.spread),
      size: clampRange(nextState.size, 0, 500, innerGlow.size),
      range: clampRange(nextState.range, 0, 100, rangeFallback),
      jitter: clampRange(nextState.jitter, 0, 100, jitterFallback),
    };
    onUpdate({ innerGlow: sanitized });
  };

  const commitOuterGlow = (
    updates:
      | Partial<NonNullable<Layer['outerGlow']>>
      | ((
          prev: NonNullable<Layer['outerGlow']>
        ) => Partial<NonNullable<Layer['outerGlow']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(outerGlow) : updates;
    const nextState: NonNullable<Layer['outerGlow']> = {
      ...outerGlow,
      ...nextPartial,
    };
    const rangeFallback = outerGlow.range ?? DEFAULT_OUTER_GLOW.range ?? 50;
    const jitterFallback = outerGlow.jitter ?? DEFAULT_OUTER_GLOW.jitter ?? 0;
    const sanitized: NonNullable<Layer['outerGlow']> = {
      ...nextState,
      opacity: clamp01(nextState.opacity),
      spread: clampRange(nextState.spread, 0, 100, outerGlow.spread),
      size: clampRange(nextState.size, 0, 500, outerGlow.size),
      range: clampRange(nextState.range, 0, 100, rangeFallback),
      jitter: clampRange(nextState.jitter, 0, 100, jitterFallback),
    };
    onUpdate({ outerGlow: sanitized });
  };

  const commitBevelEmboss = (
    updates:
      | Partial<NonNullable<Layer['bevelEmboss']>>
      | ((
          prev: NonNullable<Layer['bevelEmboss']>
        ) => Partial<NonNullable<Layer['bevelEmboss']>>)
  ) => {
    const nextPartial =
      typeof updates === 'function' ? updates(bevelEmboss) : updates;
    const nextState: NonNullable<Layer['bevelEmboss']> = {
      ...bevelEmboss,
      ...nextPartial,
    };
    const sanitized: NonNullable<Layer['bevelEmboss']> = {
      ...nextState,
      depth: clampRange(nextState.depth, 1, 1000, bevelEmboss.depth),
      size: clampRange(nextState.size, 0, 500, bevelEmboss.size),
      soften: clampRange(nextState.soften, 0, 50, bevelEmboss.soften),
      angle: clampAngle(nextState.angle, bevelEmboss.angle),
      altitude: clampRange(nextState.altitude, 0, 90, bevelEmboss.altitude),
      highlightOpacity: clamp01(nextState.highlightOpacity),
      shadowOpacity: clamp01(nextState.shadowOpacity),
    };
    onUpdate({ bevelEmboss: sanitized });
  };

  return (
    <div
      className={containerClass}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <FillControls
        theme={theme}
        fillType={fillType}
        baseColor={layer.fillColor || layer.color || '#ffffff'}
        gradientState={fillGradientState}
        onFillTypeChange={value => {
          if (value === 'gradient') {
            onUpdate({
              fillType: 'gradient',
              fillGradient: buildFillGradientPayload(fillGradientState),
            });
          } else {
            onUpdate({ fillType: value as 'none' | 'solid' });
          }
        }}
        onFillColorChange={color => onUpdate({ fillColor: color })}
        onCommitGradient={commitFillGradient}
      />
      <StrokeControls
        theme={theme}
        strokeType={strokeType}
        strokeAlign={strokeAlign}
        strokeWidth={strokeWidth}
        strokeColor={layer.strokeColor || '#000000'}
        strokeDasharray={layer.strokeDasharray || ''}
        gradientState={strokeGradientState}
        onStrokeTypeChange={value => {
          if (value === 'gradient') {
            onUpdate({
              strokeType: 'gradient',
              strokeGradient: buildStrokeGradientPayload(strokeGradientState),
            });
          } else {
            onUpdate({ strokeType: value as 'none' | 'solid' });
          }
        }}
        onStrokeAlignChange={value =>
          onUpdate({ strokeAlign: value as 'center' | 'inner' | 'outer' })
        }
        onStrokeWidthChange={w => onUpdate({ strokeWidth: w })}
        onStrokeColorChange={color => onUpdate({ strokeColor: color })}
        onStrokeDasharrayChange={pattern =>
          onUpdate({ strokeDasharray: pattern })
        }
        onCommitGradient={commitStrokeGradient}
      />

      <DropShadowControls
        value={dropShadow}
        globalLight={globalLight}
        theme={theme}
        onChange={commitDropShadow}
        onChangeGlobalLight={commitGlobalLight}
      />
      <InnerShadowControls
        value={innerShadow}
        globalLight={globalLight}
        theme={theme}
        onChange={commitInnerShadow}
        onChangeGlobalLight={commitGlobalLight}
      />
      <OuterGlowControls
        value={outerGlow}
        theme={theme}
        onChange={commitOuterGlow}
      />
      <InnerGlowControls
        value={innerGlow}
        theme={theme}
        onChange={commitInnerGlow}
      />

      <BevelEmbossControls
        value={bevelEmboss}
        globalLight={globalLight}
        theme={theme}
        onChange={commitBevelEmboss}
        onChangeGlobalLight={commitGlobalLight}
      />
      <GlobalLightControls
        value={globalLight}
        theme={theme}
        onChange={commitGlobalLight}
      />
    </div>
  );
};
