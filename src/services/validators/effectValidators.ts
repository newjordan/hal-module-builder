import { ERR } from '../validation/errorCodes';
import { ValidationResult } from '../validation/validationTypes';

import { sanitizeNumber } from './commonValidators';
import { validateColor } from './uiValidators';

// Local constants (mirrors layerValidators)
const COLOR_MODES = [
  'solid',
  'gradient',
  'rainbow',
  'reactive',
  'custom-gradient',
  'radial-gradient',
] as const;

function getDefaultEqualizerSettings() {
  return {
    barCount: 32,
    barStyle: 'block',
    barWidth: 2,
    barSpacing: 1,
    barRotation: 0,
    radialRotation: 0,
    innerRadius: 120,
    maxHeight: 30,
    responseSpeed: 0.7,
    frequencyRange: 'full',
    radialOrientation: 'follow-radius',
    colorMode: 'solid',
    primaryColor: '#ff0000',
    secondaryColor: '#0000ff',
    glowIntensity: 0.3,
    glowColor: '#ff0000',
    symmetry: 'none',
    pulseMode: 'subtle',
    positionX: 0,
    positionY: 0,
    startAngle: 0,
    endAngle: 360,
    arcMode: false,
    radialSizingMode: 'flat',
    invertDirection: false,
    invert: false,
  };
}

function validateEqualizerSettings(settings: any): ValidationResult {
  if (!settings || typeof settings !== 'object') {
    return {
      isValid: false,
      errors: [ERR.EQUALIZER_SETTINGS_OBJECT],
      warnings: [],
      sanitizedValue: getDefaultEqualizerSettings(),
    };
  }
  const sanitized: any = {};
  sanitized.barCount = sanitizeNumber(settings.barCount, 32, 8, 128);
  const barStyles = [
    'line',
    'bar',
    'dot',
    'block',
    'triangle',
    'diamond',
    'hexagon',
    'circle',
  ];
  sanitized.barStyle = barStyles.includes(settings.barStyle)
    ? settings.barStyle
    : 'block';
  sanitized.barWidth = sanitizeNumber(settings.barWidth, 2, 0.5, 20);
  sanitized.barSpacing = sanitizeNumber(settings.barSpacing, 1, 0, 10);
  const radialSizingModes = ['flat', 'depth'];
  sanitized.radialSizingMode = radialSizingModes.includes(
    settings.radialSizingMode
  )
    ? settings.radialSizingMode
    : 'flat';
  const radialOrientationModes = [
    'follow-radius',
    'follow-tangent',
    'maintain',
  ];
  sanitized.radialOrientation = radialOrientationModes.includes(
    settings.radialOrientation
  )
    ? settings.radialOrientation
    : 'follow-radius';
  sanitized.showRadialPath = Boolean(settings.showRadialPath);
  const invertFlag =
    typeof settings.invertDirection === 'boolean'
      ? settings.invertDirection
      : Boolean(settings.invert);
  sanitized.invertDirection = invertFlag;
  sanitized.invert = invertFlag;
  const markerShapes = ['circle', 'square', 'triangle'];
  const rawMarkers = Array.isArray(settings.debugMarkers)
    ? settings.debugMarkers
    : [
        { id: 'marker-1', shape: 'circle', position: 0, color: '#ffffff' },
        { id: 'marker-2', shape: 'square', position: 0.33, color: '#00ffff' },
        { id: 'marker-3', shape: 'triangle', position: 0.66, color: '#ff00ff' },
      ];
  sanitized.debugMarkers = rawMarkers.map((marker: any, index: number) => ({
    id: marker?.id || `marker-${index + 1}`,
    shape: markerShapes.includes(String(marker?.shape).toLowerCase())
      ? (String(marker.shape).toLowerCase() as 'circle' | 'square' | 'triangle')
      : 'circle',
    position: Math.min(1, Math.max(0, Number(marker?.position) || 0)),
    color: typeof marker?.color === 'string' ? marker.color : '#ffffff',
    size: Math.max(4, Math.min(48, Number(marker?.size) || 12)),
  }));
  sanitized.innerRadius = sanitizeNumber(settings.innerRadius, 120, 10, 300);
  sanitized.maxHeight = sanitizeNumber(settings.maxHeight, 30, 5, 100);
  sanitized.responseSpeed = sanitizeNumber(settings.responseSpeed, 0.7, 0.1, 1);
  const frequencyRanges = ['bass', 'mid', 'treble', 'full'];
  sanitized.frequencyRange = frequencyRanges.includes(settings.frequencyRange)
    ? settings.frequencyRange
    : 'full';
  const colorModes = Array.from(COLOR_MODES);
  sanitized.colorMode = colorModes.includes(settings.colorMode)
    ? settings.colorMode
    : 'solid';
  const p = validateColor(settings.primaryColor);
  sanitized.primaryColor = p.isValid ? settings.primaryColor : '#ff0000';
  const s = validateColor(settings.secondaryColor);
  sanitized.secondaryColor = s.isValid ? settings.secondaryColor : '#0000ff';
  return { isValid: true, errors: [], warnings: [], sanitizedValue: sanitized };
}

export const effectValidators = {
  validateEqualizerSettings,
};

export default effectValidators;
