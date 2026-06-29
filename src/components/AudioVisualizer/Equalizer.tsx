/**
 * Equalizer Component - Audio visualization equalizer
 *
 * Extracted from HalModuleBuilder.tsx to provide modular equalizer functionality.
 * Wraps the EqualizerEngine component with proper prop handling and state management.
 */

import React, { useMemo } from 'react';
import { EqualizerEngine } from '../EqualizerEngine/EqualizerEngine';
import { EqualizerProps } from './AudioVisualizer.types';

export const Equalizer: React.FC<EqualizerProps> = ({
  audioData,
  layer,
  onLayerUpdate: _onLayerUpdate,
}) => {
  // Memoize base style to prevent unnecessary recalculations
  const baseStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: layer.opacity,
      transform: `
      scale(${layer.scale})
      rotate(${layer.rotation}deg)
      translate(${layer.offsetX}px, ${layer.offsetY}px)
    `,
      mixBlendMode: layer.blendMode as any,
      visibility: layer.visible ? ('visible' as const) : ('hidden' as const),
      pointerEvents: 'none' as const,
    }),
    [
      layer.opacity,
      layer.scale,
      layer.rotation,
      layer.offsetX,
      layer.offsetY,
      layer.blendMode,
      layer.visible,
    ]
  );

  // Get current theme from document
  const theme = document.documentElement.classList.contains('frost_dark')
    ? 'frost_dark'
    : 'frost_light';

  // Calculate size from viewport (matching original logic)
  const size = Math.min(window.innerWidth, window.innerHeight);

  // Only render if layer has equalizer settings
  if (!layer.equalizerSettings) {
    return null;
  }

  return (
    <div
      key={layer.id}
      style={baseStyle}
      data-eq-wrapper
      data-layer-id={layer.id}
    >
      <EqualizerEngine
        equalizerSettings={layer.equalizerSettings}
        audioData={audioData}
        isActive={layer.visible}
        size={size}
        theme={theme}
        // Wire AppearancePanel effects into the rendering pipeline
        // Merge layer equalizer settings with appearance so the engine receives all settings
        config={
          {
            ...(layer.equalizerSettings || {}),
            appearance: {
              dropShadow: layer.dropShadow,
              outerGlow: layer.outerGlow,
              innerGlow: layer.innerGlow,
              innerShadow: layer.innerShadow,
              bevelEmboss: layer.bevelEmboss,
              globalLight: layer.globalLight,
            },
          } as any
        }
      />
    </div>
  );
};

export default Equalizer;
