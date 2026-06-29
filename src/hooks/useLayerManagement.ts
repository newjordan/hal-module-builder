import { useState, useCallback } from 'react';
import { Layer } from '../types/layer-types';
import {
  DEFAULT_RADIAL_TEXT_CONFIG,
  DEFAULT_RADIAL_TEXT_EFFECTS,
  DEFAULT_RADIAL_TEXT_ANIMATION,
} from '../types/radial-text-types';
import { optimizedLayerUpdate, moveLayerOptimized } from '../utils/layer-utils';
import { generateLayerId, ensureUniqueId } from '../utils/id-utils';
import { createShapeLayer, initializeShapeLibrary } from '../assets/shapes';

// Ensure shapes are registered before layer creation
initializeShapeLibrary();

export interface UseLayerManagementReturn {
  // State
  layers: Layer[];
  selectedLayerId: string;
  multiSelectedLayers: Set<string>;
  expandedLayers: Set<string>;
  newLayerType: Layer['type'];

  // State setters
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  setSelectedLayerId: React.Dispatch<React.SetStateAction<string>>;
  setMultiSelectedLayers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedLayers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setNewLayerType: React.Dispatch<React.SetStateAction<Layer['type']>>;

  // Layer CRUD operations
  addNewLayer: (typeOverride?: Layer['type']) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  renameLayer: (layerId: string, newName: string) => void;

  // Layer manipulation
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  updateLayerImageSource: (layerId: string, imageUrl: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  handleShapeTypeChange: (layerId: string, newShapeType: string) => void;

  // Selection management
  handleLayerClick: (layerId: string, event: React.MouseEvent) => void;
  selectAllLayers: () => void;
  deselectAllLayers: () => void;
  deleteSelectedLayers: () => void;
  duplicateSelectedLayers: () => void;

  // Utility
  toggleLayerExpanded: (layerId: string) => void;
}

export const useLayerManagement = (
  initialLayers: Layer[] = [],
  initialSelectedLayerId: string = ''
): UseLayerManagementReturn => {
  // Core layer state
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string>(
    initialSelectedLayerId
  );
  const [multiSelectedLayers, setMultiSelectedLayers] = useState<Set<string>>(
    new Set()
  );
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [newLayerType, setNewLayerType] = useState<Layer['type']>('shape');

  // Layer update handler
  const updateLayer = useCallback(
    (layerId: string, updates: Partial<Layer>) => {
      setLayers(prev => optimizedLayerUpdate(prev, layerId, updates));
    },
    []
  );

  // Layer movement handler
  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => moveLayerOptimized(prev, layerId, direction));
  }, []);

  // Shape type change handler
  const handleShapeTypeChange = useCallback(
    (layerId: string, newShapeType: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || layer.type !== 'shape') return;

      // Get default properties for the new shape type
      const shapeProps = createShapeLayer(newShapeType, layer.name);
      if (!shapeProps) return;

      // Update the layer with new shape properties
      updateLayer(layerId, {
        shapeType: newShapeType as any,
        ...(shapeProps.shapeSpecific && {
          shapeSpecific: shapeProps.shapeSpecific,
        }),
        // Preserve other properties like position, opacity, etc.
        name: layer.name,
        opacity: layer.opacity,
        scale: layer.scale,
        rotation: layer.rotation,
        offsetX: layer.offsetX,
        offsetY: layer.offsetY,
        visible: layer.visible,
        blendMode: layer.blendMode,
      });
    },
    [layers, updateLayer]
  );

  // Add new layer function
  const addNewLayer = useCallback(
    (typeOverride?: Layer['type']) => {
      const layerType = typeOverride || newLayerType;
      const timestamp = Date.now();
      const layerCount = layers.filter(l => l.type === layerType).length;

      let newLayer: Layer = {
        id: `layer_${timestamp}`,
        name: '',
        type: layerType,
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      // Set type-specific defaults
      switch (layerType) {
        case 'gradient':
          newLayer.name = `Gradient Layer ${layerCount + 1}`;
          newLayer.gradient = {
            type: 'linear',
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
            angle: 90,
          };
          break;

        case 'image':
          newLayer.name = `Image Layer ${layerCount + 1}`;
          newLayer.src = '';
          newLayer.brightness = 1;
          newLayer.contrast = 1;
          break;

        case 'equalizer':
          newLayer.name = `Equalizer Layer ${layerCount + 1}`;
          newLayer.equalizerSettings = {
            barCount: 32,
            barStyle: 'line',
            barWidth: 2,
            barSpacing: 1,
            barRotation: 0,
            innerRadius: 120,
            maxHeight: 30,
            responseSpeed: 0.7,
            frequencyRange: 'full',
            colorMode: 'gradient',
            primaryColor: '#00ff00',
            secondaryColor: '#0000ff',
            customGradient: {
              colors: ['#ff0000', '#00ff00', '#0000ff'],
              stops: [0, 0.5, 1],
            },
            radialGradientSettings: {
              fromCenter: true,
              colors: ['#ffffff', '#ff0000', '#000000'],
              stops: [0, 0.5, 1],
            },
            glowIntensity: 0.5,
            symmetry: 'none',
            pulseMode: 'none',
            positionX: 50,
            positionY: 50,
            startAngle: 0,
            endAngle: 360,
            arcMode: false,
          };
          break;

        case 'shape':
          newLayer.name = `Shape Layer ${layerCount + 1}`;
          try {
            const shapeLayer = createShapeLayer('circle', newLayer.name);
            if (shapeLayer) {
              newLayer = {
                ...newLayer,
                ...shapeLayer,
                type: 'shape' as Layer['type'],
                shapeType: (shapeLayer.shapeType || 'circle') as NonNullable<
                  Layer['shapeType']
                >,
              };
              // Default: white ring (no fill, white stroke)
              newLayer.fillType = 'none';
              newLayer.strokeType = 'solid';
              newLayer.strokeColor = '#ffffff';
              newLayer.strokeWidth = 2;
            }
          } catch (error) {
            // Shape layer creation failed, use default shape properties
            newLayer.fillType = 'none';
            newLayer.strokeType = 'solid';
            newLayer.strokeColor = '#ffffff';
            newLayer.strokeWidth = 2;
          }
          newLayer.blendMode = 'screen';
          break;

        case 'audio':
          newLayer.name = `Audio Layer ${layerCount + 1}`;
          newLayer.audioType = 'output';
          newLayer.textToSpeak = 'Welcome to the HAL Module Builder.';
          newLayer.status = 'idle';
          newLayer.voiceId = 'GBv7mTt0atIp3Br8iCZE'; // Thomas
          newLayer.voiceSettings = {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5, // Default style value
            use_speaker_boost: false,
          };
          break;

        case 'radialText': {
          const radialTheme: 'frost_light' | 'frost_dark' = 'frost_dark';
          newLayer.name = `Radial Text Layer ${layerCount + 1}`;
          (newLayer as any).radialTextConfig = {
            ...DEFAULT_RADIAL_TEXT_CONFIG,
            theme: radialTheme,
            text: 'HAL Text',
          };
          (newLayer as any).radialTextEffects = {
            ...DEFAULT_RADIAL_TEXT_EFFECTS,
            theme: radialTheme,
            glowIntensity: 0.8,
            glowColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
          };
          (newLayer as any).radialTextAnimation = {
            ...DEFAULT_RADIAL_TEXT_ANIMATION,
            theme: radialTheme,
            textAnimationType: 'typewriter',
            animationDuration: 2000,
            staggerDelay: 100,
          };
          break;
        }
      }

      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    },
    [layers, newLayerType]
  );

  // Duplicate layer function
  const duplicateLayer = useCallback(
    (layerId: string) => {
      const layerToDuplicate = layers.find(l => l.id === layerId);
      if (!layerToDuplicate) return;

      const duplicatedLayer: Layer = {
        ...JSON.parse(JSON.stringify(layerToDuplicate)),
        id: ensureUniqueId(layers, generateLayerId(), 'layer'),
        name: `${layerToDuplicate.name} (Copy)`,
      };

      const index = layers.findIndex(l => l.id === layerId);
      const newLayers = [...layers];
      newLayers.splice(index + 1, 0, duplicatedLayer);
      setLayers(newLayers);
      setSelectedLayerId(duplicatedLayer.id);
    },
    [layers]
  );

  // Delete layer function
  const deleteLayer = useCallback(
    (layerId: string) => {
      setLayers(prev => {
        if (prev.length <= 1) {
          return prev;
        }

        const filtered = prev.filter(l => l.id !== layerId);
        const nextSelectedLayerId = filtered[0]?.id ?? '';
        if (selectedLayerId === layerId) {
          setSelectedLayerId(nextSelectedLayerId);
        }
        return filtered;
      });
    },
    [selectedLayerId]
  );

  // Rename layer function
  const renameLayer = useCallback(
    (layerId: string, newName: string) => {
      updateLayer(layerId, { name: newName });
    },
    [updateLayer]
  );

  const updateLayerImageSource = useCallback(
    (layerId: string, imageUrl: string) => {
      setLayers(currentLayers =>
        currentLayers.map(layer =>
          layer.id === layerId
            ? { ...layer, src: imageUrl, type: 'image' }
            : layer
        )
      );
    },
    []
  );

  // Multi-selection click handler
  const handleLayerClick = useCallback(
    (layerId: string, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+click for individual selection
        setMultiSelectedLayers(prev => {
          const newSet = new Set(prev);
          if (newSet.has(layerId)) {
            newSet.delete(layerId);
          } else {
            newSet.add(layerId);
          }
          return newSet;
        });
      } else if (event.shiftKey && selectedLayerId) {
        // Shift+click for range selection
        const startIndex = layers.findIndex(l => l.id === selectedLayerId);
        const endIndex = layers.findIndex(l => l.id === layerId);

        if (startIndex !== -1 && endIndex !== -1) {
          const start = Math.min(startIndex, endIndex);
          const end = Math.max(startIndex, endIndex);
          const rangeIds = new Set<string>();

          for (let i = start; i <= end; i++) {
            const layer = layers[i];
            if (layer) {
              rangeIds.add(layer.id);
            }
          }

          setMultiSelectedLayers(rangeIds);
        }
      } else {
        // Regular click - single selection
        setSelectedLayerId(layerId);
        setMultiSelectedLayers(new Set());
      }
    },
    [selectedLayerId, layers]
  );

  // Select all layers
  const selectAllLayers = useCallback(() => {
    const allLayerIds = new Set(layers.map(layer => layer.id));
    setMultiSelectedLayers(allLayerIds);
  }, [layers]);

  // Deselect all layers
  const deselectAllLayers = useCallback(() => {
    setMultiSelectedLayers(new Set());
    setSelectedLayerId('');
  }, []);

  // Delete selected layers
  const deleteSelectedLayers = useCallback(() => {
    if (multiSelectedLayers.size === 0) return;

    setLayers(prev => {
      if (multiSelectedLayers.size >= prev.length) {
        return prev;
      }
      return prev.filter(layer => !multiSelectedLayers.has(layer.id));
    });

    // Clear selections
    setMultiSelectedLayers(new Set());
    if (multiSelectedLayers.has(selectedLayerId)) {
      setSelectedLayerId('');
    }
  }, [multiSelectedLayers, selectedLayerId]);

  // Duplicate selected layers
  const duplicateSelectedLayers = useCallback(() => {
    if (multiSelectedLayers.size === 0) return;

    const selectedLayers = layers.filter(layer =>
      multiSelectedLayers.has(layer.id)
    );
    const duplicates: Layer[] = [];

    selectedLayers.forEach(layer => {
      const duplicatedLayer: Layer = {
        ...JSON.parse(JSON.stringify(layer)),
        id: ensureUniqueId(
          [...layers, ...duplicates],
          generateLayerId(),
          'layer'
        ),
        name: `${layer.name} (Copy)`,
      };
      duplicates.push(duplicatedLayer);
    });

    setLayers(prev => [...prev, ...duplicates]);

    // Select the duplicated layers
    const duplicateIds = new Set(duplicates.map(layer => layer.id));
    setMultiSelectedLayers(duplicateIds);
    setSelectedLayerId(duplicates[0]?.id || '');
  }, [multiSelectedLayers, layers]);

  // Toggle layer expanded state
  const toggleLayerExpanded = useCallback((layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);

  return {
    // State
    layers,
    selectedLayerId,
    multiSelectedLayers,
    expandedLayers,
    newLayerType,

    // State setters
    setLayers,
    setSelectedLayerId,
    setMultiSelectedLayers,
    setExpandedLayers,
    setNewLayerType,

    // Layer CRUD operations
    addNewLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,

    // Layer manipulation
    updateLayer,
    moveLayer,
    handleShapeTypeChange,
    updateLayerImageSource,

    // Selection management
    handleLayerClick,
    selectAllLayers,
    deselectAllLayers,
    deleteSelectedLayers,
    duplicateSelectedLayers,

    // Utility
    toggleLayerExpanded,
  };
};

export default useLayerManagement;
