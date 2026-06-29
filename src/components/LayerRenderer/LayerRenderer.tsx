import React, { memo, useMemo, useCallback } from 'react';
import { Layer } from '../../types/layer-types';
import { EqualizerEngine } from '../EqualizerEngine/EqualizerEngine';
import { RadialTextRenderer } from '../RadialText/RadialTextRenderer';

interface LayerRendererProps {
  layer: Layer;
  index: number;
  isVisible: boolean;
  isSelected: boolean;
  onSelect: (layerId: string) => void;
  onUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onDelete: (layerId: string) => void;
  onDuplicate: (layerId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  // Audio data for equalizer layers
  audioData?: number[];
  isActive?: boolean;
  theme?: 'frost_light' | 'frost_dark';
  size?: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const formatLinearStops = (colors: string[], stops?: number[]): string => {
  const denominator = Math.max(colors.length - 1, 1);

  return colors
    .map((color, idx) => {
      const raw =
        Array.isArray(stops) && typeof stops[idx] === 'number'
          ? (stops[idx] as number)
          : denominator > 0
            ? idx / denominator
            : 0;
      const percent = clamp01(raw) * 100;
      return `${color} ${percent}%`;
    })
    .join(', ');
};

const formatConicStops = (colors: string[], stops?: number[]): string => {
  const denominator = Math.max(colors.length, 1);

  return colors
    .map((color, idx) => {
      const raw =
        Array.isArray(stops) && typeof stops[idx] === 'number'
          ? (stops[idx] as number)
          : denominator > 0
            ? idx / denominator
            : 0;
      const degrees = clamp01(raw) * 360;
      return `${color} ${degrees}deg`;
    })
    .join(', ');
};

const LayerRenderer: React.FC<LayerRendererProps> = memo(
  ({
    layer,
    index: _index,
    isVisible,
    isSelected,
    onSelect,
    onUpdate: _onUpdate,
    onDelete: _onDelete,
    onDuplicate: _onDuplicate,
    onMove: _onMove,
    audioData = [],
    isActive = false,
    theme = 'frost_light',
    size = 400,
  }) => {
    const handleSelect = useCallback(() => {
      onSelect(layer.id);
    }, [onSelect, layer.id]);

    const layerStyle = useMemo(() => {
      const baseStyle: React.CSSProperties = {
        position: 'absolute',
        opacity: layer.opacity,
        transform: `
        translate(${layer.offsetX}px, ${layer.offsetY}px) 
        scale(${layer.scale}) 
        rotate(${layer.rotation}deg)
        translateZ(0)
      `,
        mixBlendMode: layer.blendMode as any,
        willChange: 'transform, opacity',
        visibility: layer.visible ? 'visible' : 'hidden',
      };

      return baseStyle;
    }, [
      layer.opacity,
      layer.offsetX,
      layer.offsetY,
      layer.scale,
      layer.rotation,
      layer.blendMode,
      layer.visible,
    ]);

    const renderLayerContent = useMemo(() => {
      switch (layer.type) {
        case 'image':
          return layer.src ? (
            <img
              src={layer.src}
              alt={layer.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: `brightness(${layer.brightness || 100}%) contrast(${layer.contrast || 100}%)`,
              }}
              loading='lazy'
            />
          ) : null;

        case 'shape':
          // Build shape styles based on shape type and fill/stroke settings
          const shapeStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
          };

          // Handle shape type specific styles
          if (layer.shapeType === 'circle' || layer.circleSettings) {
            shapeStyle.borderRadius = '50%';
          }

          // Handle fill type
          if (layer.fillType === 'solid') {
            shapeStyle.backgroundColor =
              layer.fillColor || layer.color || '#000000';
          } else if (layer.fillType === 'gradient' && layer.fillGradient) {
            const {
              type,
              colors,
              stops,
              angle = 0,
              centerX = 50,
              centerY = 50,
            } = layer.fillGradient;
            let gradientStyle = '';

            if (type === 'linear') {
              const colorStops = formatLinearStops(colors, stops);
              gradientStyle = `linear-gradient(${angle}deg, ${colorStops})`;
            } else if (type === 'radial') {
              const colorStops = formatLinearStops(colors, stops);
              gradientStyle = `radial-gradient(circle at ${centerX}% ${centerY}%, ${colorStops})`;
            } else if (type === 'conic') {
              const colorStops = formatConicStops(colors, stops);
              gradientStyle = `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${colorStops})`;
            }

            shapeStyle.background = gradientStyle;
          } else if (layer.gradient) {
            // Legacy gradient support
            const {
              type,
              colors,
              stops,
              angle = 0,
              centerX = 50,
              centerY = 50,
            } = layer.gradient;
            let gradientStyle = '';

            if (type === 'linear') {
              const colorStops = formatLinearStops(colors, stops);
              gradientStyle = `linear-gradient(${angle}deg, ${colorStops})`;
            } else if (type === 'radial') {
              const colorStops = formatLinearStops(colors, stops);
              gradientStyle = `radial-gradient(circle at ${centerX}% ${centerY}%, ${colorStops})`;
            } else if (type === 'conic') {
              const colorStops = formatConicStops(colors, stops);
              gradientStyle = `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${colorStops})`;
            }

            shapeStyle.background = gradientStyle;
          }

          // Handle stroke
          if (layer.strokeType === 'solid' && layer.strokeWidth) {
            shapeStyle.border = `${layer.strokeWidth}px solid ${layer.strokeColor || '#000000'}`;
          }

          return <div style={shapeStyle} />;

        case 'equalizer':
          if (layer.equalizerSettings) {
            return (
              <EqualizerEngine
                equalizerSettings={layer.equalizerSettings}
                audioData={audioData}
                isActive={isActive && layer.visible}
                size={size}
                theme={theme}
                style={{ width: '100%', height: '100%' }}
              />
            );
          }
          return null;

        case 'radialText': {
          const radialTextLayer = layer as any;

          if (!radialTextLayer.radialTextConfig) return null;

          const layerTheme =
            radialTextLayer.radialTextConfig.theme ||
            radialTextLayer.theme ||
            theme;

          return (
            <div
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <RadialTextRenderer
                theme={layerTheme}
                config={radialTextLayer.radialTextConfig}
                {...(radialTextLayer.radialTextEffects !== undefined
                  ? { effects: radialTextLayer.radialTextEffects }
                  : {})}
                appearance={layer as any}
                {...(radialTextLayer.radialTextAnimation !== undefined
                  ? { animation: radialTextLayer.radialTextAnimation }
                  : {})}
                {...(audioData
                  ? { audioData: new Float32Array(audioData) }
                  : {})}
                isActive={isActive && layer.visible}
                size={size}
                className='frost-absolute frost-inset-0'
              />
            </div>
          );
        }

        default:
          return null;
      }
    }, [layer, audioData, isActive, size, theme]);

    if (!isVisible) {
      return null;
    }

    return (
      <div
        className={`absolute layer-item ${isSelected ? 'selected' : ''}`}
        style={layerStyle}
        onClick={handleSelect}
        data-layer-id={layer.id}
        data-layer-type={layer.type}
        data-testid={`layer-${layer.id}`}
      >
        {renderLayerContent}

        {isSelected && (
          <div className='absolute -top-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none'>
            {layer.name}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for equalizerSettings if present
    const equalizerSettingsEqual =
      prevProps.layer.type !== 'equalizer' ||
      JSON.stringify(prevProps.layer.equalizerSettings) ===
        JSON.stringify(nextProps.layer.equalizerSettings);

    return (
      prevProps.layer.id === nextProps.layer.id &&
      prevProps.layer.visible === nextProps.layer.visible &&
      prevProps.layer.opacity === nextProps.layer.opacity &&
      prevProps.layer.offsetX === nextProps.layer.offsetX &&
      prevProps.layer.offsetY === nextProps.layer.offsetY &&
      prevProps.layer.scale === nextProps.layer.scale &&
      prevProps.layer.rotation === nextProps.layer.rotation &&
      prevProps.layer.blendMode === nextProps.layer.blendMode &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.index === nextProps.index &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.theme === nextProps.theme &&
      prevProps.size === nextProps.size &&
      prevProps.audioData === nextProps.audioData &&
      equalizerSettingsEqual
    );
  }
);

LayerRenderer.displayName = 'LayerRenderer';

export default LayerRenderer;
