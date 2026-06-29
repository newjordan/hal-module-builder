import { useCallback } from 'react';
import { Layer } from '../types/layer-types';
import {
  GradientType,
  GradientTarget,
  GradientPreset,
  GradientData,
} from '../utils/gradient';

// Import specialized gradient hooks
import { useGradientCore } from './gradient/useGradientCore';
import { useGradientValidation } from './gradient/useGradientValidation';
import { useGradientTargets } from './useGradientTargets';
import { useGradientPresets } from './useGradientPresets';
import { useGradientCSS } from './useGradientCSS';

export interface UseGradientManagementReturn {
  // Basic gradient management
  addGradientColor: (
    layerId: string,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  removeGradientColor: (
    layerId: string,
    index: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientColor: (
    layerId: string,
    index: number,
    color: string,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientStop: (
    layerId: string,
    index: number,
    stop: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;

  // Advanced gradient features
  updateGradientType: (
    layerId: string,
    type: GradientType,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientAngle: (
    layerId: string,
    angle: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientCenter: (
    layerId: string,
    centerX: number,
    centerY: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  applyGradientPreset: (
    layerId: string,
    preset: GradientPreset,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  generateGradientCSS: (
    layer: Layer,
    gradientTarget?: GradientTarget
  ) => string;
  validateGradientData: (
    colors: string[],
    stops: number[]
  ) => { colors: string[]; stops: number[] };

  // Gradient presets
  presets: GradientPreset[];
}

export const useGradientManagement = (): UseGradientManagementReturn => {
  // Orchestrate specialized gradient hooks
  const gradientCore = useGradientCore();
  const gradientValidation = useGradientValidation();
  const { applyToTarget, extractFromTarget } = useGradientTargets();
  const { presets, applyPreset: applyPresetInternal } = useGradientPresets();
  const { generateCSS } = useGradientCSS();

  // Backward-compatible arg parser:
  // some legacy call sites pass gradientTarget as the 6th arg.
  const resolveTargetArgs = useCallback(
    (
      isEqualizerOrTarget: boolean | GradientTarget | undefined,
      gradientTarget: GradientTarget | undefined
    ): { isEqualizer: boolean; target: GradientTarget } => {
      if (typeof isEqualizerOrTarget === 'string') {
        return { isEqualizer: false, target: isEqualizerOrTarget };
      }
      return {
        isEqualizer: Boolean(isEqualizerOrTarget),
        target: gradientTarget ?? 'layer',
      };
    },
    []
  );

  // Utility: Execute gradient operation with common layer/gradient handling
  const executeGradientOperation = useCallback(
    (
      layerId: string,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      gradientTarget: GradientTarget,
      isEqualizer: boolean,
      operation: (gradient: GradientData) => GradientData
    ) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;

      const target = isEqualizer ? 'custom' : gradientTarget;
      const currentGradient = extractFromTarget(layer, target);
      if (!currentGradient) return;

      try {
        const updatedGradient = operation(currentGradient);
        const updates = applyToTarget(layer, updatedGradient, target);
        updateLayer(layerId, updates);
      } catch {
        // Preserve legacy behavior: invalid gradient operations fail safely
        // without throwing into UI call sites.
      }
    },
    [extractFromTarget, applyToTarget]
  );

  // Gradient operations - all using unified execution pattern
  const addGradientColor = useCallback(
    (
      layerId: string,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      isEqualizerOrTarget: boolean | GradientTarget = false,
      gradientTarget?: GradientTarget
    ) => {
      const { isEqualizer, target } = resolveTargetArgs(
        isEqualizerOrTarget,
        gradientTarget
      );
      return (
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        target,
        isEqualizer,
        gradient => gradientCore.addColor(gradient, '#ffffff')
      )
      );
    },
    [executeGradientOperation, gradientCore, resolveTargetArgs]
  );

  const removeGradientColor = useCallback(
    (
      layerId: string,
      index: number,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      isEqualizerOrTarget: boolean | GradientTarget = false,
      gradientTarget?: GradientTarget
    ) => {
      const { isEqualizer, target } = resolveTargetArgs(
        isEqualizerOrTarget,
        gradientTarget
      );
      return (
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        target,
        isEqualizer,
        gradient => gradientCore.removeColor(gradient, index)
      )
      );
    },
    [executeGradientOperation, gradientCore, resolveTargetArgs]
  );

  const updateGradientColor = useCallback(
    (
      layerId: string,
      index: number,
      color: string,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      isEqualizerOrTarget: boolean | GradientTarget = false,
      gradientTarget?: GradientTarget
    ) => {
      if (!gradientValidation.validateColor(color)) return;
      const { isEqualizer, target } = resolveTargetArgs(
        isEqualizerOrTarget,
        gradientTarget
      );
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        target,
        isEqualizer,
        gradient => gradientCore.updateColor(gradient, index, color)
      );
    },
    [executeGradientOperation, gradientCore, gradientValidation, resolveTargetArgs]
  );

  const updateGradientStop = useCallback(
    (
      layerId: string,
      index: number,
      stop: number,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      isEqualizerOrTarget: boolean | GradientTarget = false,
      gradientTarget?: GradientTarget
    ) => {
      const { isEqualizer, target } = resolveTargetArgs(
        isEqualizerOrTarget,
        gradientTarget
      );
      return (
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        target,
        isEqualizer,
        gradient => gradientCore.updateStop(gradient, index, stop)
      )
      );
    },
    [executeGradientOperation, gradientCore, resolveTargetArgs]
  );

  const updateGradientType = useCallback(
    (
      layerId: string,
      type: GradientType,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      gradientTarget: GradientTarget = 'layer'
    ) =>
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        gradientTarget,
        false,
        gradient => gradientCore.updateType(gradient, type)
      ),
    [executeGradientOperation, gradientCore]
  );

  const updateGradientAngle = useCallback(
    (
      layerId: string,
      angle: number,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      gradientTarget: GradientTarget = 'layer'
    ) => {
      if (!gradientValidation.validateAngle(angle)) return;
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        gradientTarget,
        false,
        gradient => gradientCore.updateAngle(gradient, angle)
      );
    },
    [executeGradientOperation, gradientCore, gradientValidation]
  );

  const updateGradientCenter = useCallback(
    (
      layerId: string,
      centerX: number,
      centerY: number,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      gradientTarget: GradientTarget = 'layer'
    ) => {
      if (
        !gradientValidation.validatePosition(centerX) ||
        !gradientValidation.validatePosition(centerY)
      )
        return;
      executeGradientOperation(
        layerId,
        updateLayer,
        layers,
        gradientTarget,
        false,
        gradient => gradientCore.updateCenter(gradient, centerX, centerY)
      );
    },
    [executeGradientOperation, gradientCore, gradientValidation]
  );

  // Simplified delegation functions
  const applyGradientPreset = useCallback(
    (
      layerId: string,
      preset: GradientPreset,
      updateLayer: (layerId: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      gradientTarget: GradientTarget = 'layer'
    ) =>
      applyPresetInternal(
        layerId,
        preset.name,
        updateLayer,
        layers,
        gradientTarget
      ),
    [applyPresetInternal]
  );

  const generateGradientCSS = useCallback(
    (layer: Layer, gradientTarget: GradientTarget = 'layer'): string => {
      const target = gradientTarget;
      const gradientData = extractFromTarget(layer, target);
      return gradientData ? generateCSS(gradientData) : '';
    },
    [extractFromTarget, generateCSS]
  );

  const validateGradientData = useCallback(
    (
      colors: string[],
      stops: number[]
    ): { colors: string[]; stops: number[] } => {
      const result = gradientValidation.validateGradientData(colors, stops);
      return result.isValid ? { colors, stops } : { colors: [], stops: [] };
    },
    [gradientValidation]
  );

  return {
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    updateGradientStop,
    updateGradientType,
    updateGradientAngle,
    updateGradientCenter,
    applyGradientPreset,
    generateGradientCSS,
    validateGradientData,
    presets,
  };
};

export default useGradientManagement;
