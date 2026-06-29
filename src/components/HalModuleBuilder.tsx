import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGradientManagement from '../hooks/useGradientManagement';
import { useLayerMigration } from '../hooks/useLayerMigration';
import {
  useComponentMemoryTracker,
  useMemoryMonitor,
} from '../hooks/useMemoryMonitor';
import { cleanupResizablePanel, initResizablePanel } from '../resize-panel';
import { Layer } from '../types/layer-types';
import { useKeyboardShortcuts } from '../utils/keyboard-shortcuts';
import { performanceMonitor } from '../utils/performance-monitoring';
import { PerformanceBaselineManager } from '../utils/PerformanceBaselines';
import { LayerItem } from './LayerItem';
// AudioVisualizer and TemplateManager components available for future integration
// Note: Components are extracted and functional, integration deferred for performance optimization
import { initializeShapeLibrary } from '../assets/shapes';
import useAudioContext from '../hooks/useAudioContext';
import useTemplates from '../hooks/useTemplates';
import { AnimationBottomPanel } from './AnimationStudio/AnimationBottomPanel';
import { HalInterface } from './HalInterface/HalInterface';
import './layer-panel.css';
import PerformanceMonitor from './PerformanceMonitor/PerformanceMonitor';

// Layer configuration interface - moved to types/layer-types.ts
/* interface Layer {
  id: string;
  name: string;
  type: 'image' | 'gradient' | 'solid' | 'equalizer' | 'circle';
  src?: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  color?: string;
  brightness?: number;
  contrast?: number;
  gradient?: {
    type: 'radial' | 'linear' | 'conic';
    angle?: number; // for linear gradients
    colors: string[];
    stops: number[];
    centerX?: number; // for radial gradients
    centerY?: number; // for radial gradients
  };
  // Circle specific settings
  circleSettings?: {
    radius: number;
    thickness: number;
    fillType: 'none' | 'solid' | 'gradient';
    strokeType: 'solid' | 'gradient';
    fillColor?: string;
    strokeColor?: string;
    fillGradient?: {
      type: 'radial' | 'linear' | 'conic';
      colors: string[];
      stops: number[];
      angle?: number;
    };
    strokeGradient?: {
      colors: string[];
      stops: number[];
    };
    glowIntensity: number;
    glowColor?: string;
    dashArray?: string;
    animation?: 'none' | 'rotate';
    animationSpeed?: number;
  };
  // Equalizer specific settings
  equalizerSettings?: {
    barCount: number;
    barStyle: 'bar' | 'dot' | 'circle' | 'triangle' | 'diamond' | 'hexagon';
    barWidth: number;
    barSpacing: number;
    barRotation: number; // rotation angle for bar shapes
    innerRadius: number;
    maxHeight: number;
    responseSpeed: number;
    frequencyRange: 'bass' | 'mid' | 'treble' | 'full';
    colorMode: 'solid' | 'gradient' | 'rainbow' | 'reactive' | 'custom-gradient' | 'radial-gradient';
    primaryColor: string;
    secondaryColor: string;
    customGradient?: {
      colors: string[];
      stops: number[];
    };
    radialGradientSettings?: {
      fromCenter: boolean;
      colors: string[];
      stops: number[];
    };
    glowIntensity: number;
    glowColor?: string;
    symmetry: 'none' | 'mirror' | 'rotate' | '4-fold' | '6-fold' | '8-fold' | '12-fold';
    pulseMode: 'none' | 'subtle' | 'strong';
    positionX: number;
    positionY: number;
    startAngle: number;
    endAngle: number;
    arcMode: boolean;
    invert?: boolean;
  };
} */

/* interface Preset {
  id: string;
  name: string;
  timestamp: number;
  layers: Layer[];
} */

// LayerItem component has been moved to ./LayerItem.tsx for better performance and modularity
interface HalModuleBuilderProps {
  theme: 'frost_light' | 'frost_dark';
  onThemeToggle: () => void;
}

export function HalModuleBuilder({
  theme,
  onThemeToggle,
}: HalModuleBuilderProps) {
  const [showControls, setShowControls] = useState(true);
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [_sidebarWidth, setSidebarWidth] = useState<number>(0);

  const [showPresetDialog, setShowPresetDialog] = useState(false);
  // Template load dialog functionality is now handled by useTemplates hook
  const [_selectedShapeType, _setSelectedShapeType] = useState<
    'circle' | 'rectangle' | 'triangle' | 'polygon' | 'star'
  >('circle');

  // Panel height clamp utility
  const clampPanelHeight = useCallback((h: number) => {
    const viewport = typeof window !== 'undefined' ? window.innerHeight : 900;
    const min = 200;
    const max = Math.min(
      Math.max(320, Math.round(viewport * 0.75)),
      viewport - 80
    );
    return Math.max(min, Math.min(max, h));
  }, []);

  // Timeline bottom panel state (visible by default, persistent)
  const [timelinePanelCollapsed, _setTimelinePanelCollapsed] =
    useState<boolean>(() => {
      const v = localStorage.getItem('timelinePanelCollapsed');
      return v === 'true' ? true : false;
    });
  const [timelinePanelHeight, setTimelinePanelHeight] = useState<number>(() => {
    const stored = parseInt(
      localStorage.getItem('timelinePanelHeight') || '',
      10
    );
    const initial = Number.isFinite(stored) ? stored : 320;
    return clampPanelHeight(initial);
  });

  // Show/Hide Animation Studio bottom panel (visible by default)
  const [showAnimationPanel, setShowAnimationPanel] = useState<boolean>(true);

  // Persist panel state
  useEffect(() => {
    try {
      localStorage.setItem(
        'timelinePanelCollapsed',
        String(timelinePanelCollapsed)
      );
    } catch {}
  }, [timelinePanelCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('timelinePanelHeight', String(timelinePanelHeight));
    } catch {}
  }, [timelinePanelHeight]);

  // Clamp height on window resize
  useEffect(() => {
    const onResize = () => {
      setTimelinePanelHeight(prev => clampPanelHeight(prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPanelHeight]);

  // Memory monitoring and leak detection
  const memoryMonitor = useMemoryMonitor({
    interval: 10000, // Check every 10 seconds
    warningThreshold: 0.7,
    criticalThreshold: 0.85,
    onAlert: alert => {
      console.debug(
        `Memory Alert [${alert.type.toUpperCase()}]:`,
        alert.message
      );
      if (alert.type === 'critical') {
        // Auto-cleanup on critical memory pressure
        memoryMonitor.suggestGarbageCollection();
      }
    },
  });

  // Track memory usage of this component specifically
  useComponentMemoryTracker('HalModuleBuilder');

  // REMOVED: Old static layers state - now using useLayerManagement hook with empty initial state
  /* const [layers] = useState<Layer[]>([
        barCount: 48,
        barStyle: 'line',
        barWidth: 2,
        barSpacing: 1,
        barRotation: 0,
        innerRadius: 140,
        maxHeight: 40,
        responseSpeed: 0.8,
        frequencyRange: 'full',
        colorMode: 'gradient',
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        customGradient: {
          colors: [
            '#dc2626',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#8b5cf6',
          ],
          stops: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
        },
        radialGradientSettings: {
          fromCenter: true,
          colors: ['#ffffff', '#ff0000', '#000000'],
          stops: [0, 0.5, 1],
        },
        glowIntensity: 0.5,
        glowColor: '#dc2626',
        symmetry: 'none',
        pulseMode: 'subtle',
        positionX: 0,
        positionY: 0,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
      },
    },
    {
      id: 'glow_layer',
      name: 'Glow Effect',
      type: 'gradient',
      visible: true,
      opacity: 0.3,
      blendMode: 'screen',
      scale: 0.8,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      gradient: {
        type: 'radial',
        colors: ['#dc2626', '#7f1d1d', 'transparent'],
        stops: [0, 0.5, 1],
        centerX: 50,
        centerY: 50,
      },
    },
    {
      id: 'hal_lens',
      name: 'HAL Lens',
      type: 'image',
      src: '/hal_lens.png',
      visible: true,
      opacity: 0.9,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      brightness: 1,
      contrast: 1,
    },
  ]); */

  const presetFileInputRef = useRef<HTMLInputElement>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Initialize layer management and gradient management hooks
  // Start with empty layers - no defaults
  const defaultLayers: Layer[] = [];

  const layerManagement = useLayerMigration({
    initialLayers: defaultLayers,
    enableBatchOperations: true,
    enableMultiSelection: true,
    enablePerformanceMonitoring: true,
    onMigrationStateChange: () => {},
  });
  const gradientManagement = useGradientManagement();

  // Extract layer management state and functions
  const {
    layers: managedLayers,
    selectedLayerId,
    multiSelectedLayers,
    expandedLayers,
    newLayerType,
    setLayers,
    setSelectedLayerId,
    setNewLayerType,
    addNewLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    updateLayer,
    moveLayer,
    handleShapeTypeChange,
    handleLayerClick,
    selectAllLayers,
    deselectAllLayers,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    toggleLayerExpanded,
  } = layerManagement;

  // Extract gradient management functions
  const {
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    updateGradientStop,
  } = gradientManagement;

  // Animation system: Add multiple layers (for generated animations)
  const addLayers = useCallback(
    (newLayers: Layer[]) => {
      setLayers(prev => [...prev, ...newLayers]);
    },
    [setLayers]
  );

  // Use extracted hooks for audio and template functionality
  const { audioData, isActive, toggleAudio } = useAudioContext(managedLayers, {
    fftSize: 128,
    defaultResponseSpeed: 0.8,
    autoCleanup: true,
  });

  const {
    presets,
    presetName,
    setPresetName,
    savePreset: savePresetToStorage,
    loadPreset: loadPresetFromStorage,
    deletePreset,
    exportPreset,
    importPreset,
  } = useTemplates({
    autoSave: false,
    autoRecovery: true,
    maxPresets: 100,
  });

  // Performance monitoring
  useEffect(() => {
    if (showPerformanceMonitor) {
      performanceMonitor.start();
    } else {
      performanceMonitor.stop();
    }

    // Establish performance baseline on first load
    const establishBaseline = async () => {
      try {
        const baselineManager = PerformanceBaselineManager.getInstance();
        await baselineManager.establishBaseline();
        baselineManager.startMonitoring();
      } catch (error) {
        console.debug('Failed to establish performance baseline:', error);
      }
    };

    // Only establish baseline once
    if (!sessionStorage.getItem('performance-baseline-established')) {
      sessionStorage.setItem('performance-baseline-established', 'true');
      setTimeout(establishBaseline, 2000); // Wait 2 seconds for app to load
    }

    return () => performanceMonitor.stop();
  }, [showPerformanceMonitor, managedLayers.length]);

  // Initialize resize functionality with proper cleanup
  useEffect(() => {
    // Only initialize when controls are shown
    if (!showControls) return;

    let resizePanelInstance: any = null;

    const initializeResize = () => {
      // Check if elements exist before initializing
      const resizeHandle = document.querySelector('.resize-handle');
      const sidebar = document.querySelector('.sidebar');

      if (resizeHandle && sidebar) {
        resizePanelInstance = initResizablePanel();
      } else {
        // Retry after a short delay if elements aren't ready
        setTimeout(initializeResize, 50);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      setTimeout(initializeResize, 10);
    });

    return () => {
      if (resizePanelInstance) {
        resizePanelInstance.cleanup();
      }
      cleanupResizablePanel(); // Extra safety cleanup
    };
  }, [showControls]);

  // Track sidebar width and expose it as a CSS variable for layout coordination
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setVar = (w: number) => {
      setSidebarWidth(w);
      document.body.style.setProperty('--sidebar-width', `${Math.round(w)}px`);
    };

    if (!showControls) {
      setVar(0);
      return () => {
        document.body.style.setProperty('--sidebar-width', '0px');
      };
    }

    let sidebarEl: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    const attach = () => {
      if (cancelled) return;
      sidebarEl = document.querySelector('.sidebar') as HTMLElement | null;
      if (!sidebarEl) {
        setTimeout(attach, 50);
        return;
      }
      const rect = sidebarEl.getBoundingClientRect();
      const initial = Math.max(0, Math.round(window.innerWidth - rect.left));
      setVar(initial);

      ro = new ResizeObserver(_entries => {
        // Recompute using the element's current left edge to avoid off-by-1 from borders/handles
        const r = sidebarEl!.getBoundingClientRect();
        const w = Math.max(0, Math.round(window.innerWidth - r.left));
        setVar(w);
      });
      ro.observe(sidebarEl);
    };

    // Attach after next paint to ensure element exists
    requestAnimationFrame(attach);

    const handleWindowResize = () => {
      if (!sidebarEl) return;
      const r = sidebarEl.getBoundingClientRect();
      const w = Math.max(0, Math.round(window.innerWidth - r.left));
      setVar(w);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      document.body.style.setProperty('--sidebar-width', '0px');
    };
  }, [showControls]);

  // Initialize shape library
  // Note: Effects library is initialized in main.js, equalizer in EqualizerEngine
  useEffect(() => {
    initializeShapeLibrary();
    // initializeEqualizer() removed - handled by EqualizerEngine instances
  }, []);

  const handleHalClick = async () => {
    await toggleAudio();
  };

  // Import preset functionality is now handled by useTemplates hook

  // Throttled update handlers for better responsiveness - commented out as unused
  // const throttledOpacityUpdate = useMemo(() =>
  //   throttle((layerId: string, opacity: number) => {
  //     updateLayer(layerId, { opacity });
  //   }, 16), [updateLayer]
  // );

  // Keyboard shortcuts (using extracted hook functions)
  const shortcuts = useMemo(
    () => [
      {
        key: 'd',
        ctrl: true,
        action: () => {
          duplicateSelectedLayers();
        },
        description: 'Duplicate selected layer(s)',
      },
      {
        key: 'Delete',
        action: () => {
          deleteSelectedLayers();
        },
        description: 'Delete selected layer(s)',
      },
      {
        key: 'h',
        action: () => {
          if (selectedLayerId && selectedLayer) {
            updateLayer(selectedLayerId, { visible: !selectedLayer.visible });
          }
        },
        description: 'Toggle layer visibility',
      },
      {
        key: 'ArrowUp',
        ctrl: true,
        action: () => {
          if (selectedLayerId) moveLayer(selectedLayerId, 'up');
        },
        description: 'Move layer up',
      },
      {
        key: 'ArrowDown',
        ctrl: true,
        action: () => {
          if (selectedLayerId) moveLayer(selectedLayerId, 'down');
        },
        description: 'Move layer down',
      },
      {
        key: 'a',
        ctrl: true,
        action: () => {
          selectAllLayers();
        },
        description: 'Select all layers',
      },
      {
        key: 'Escape',
        action: () => {
          deselectAllLayers();
        },
        description: 'Deselect all layers',
      },
      {
        key: 'p',
        alt: true,
        action: () => {
          setShowPerformanceMonitor(prev => !prev);
        },
        description: 'Toggle performance monitor',
      },
    ],
    [
      selectedLayerId,
      managedLayers,
      duplicateSelectedLayers,
      deleteSelectedLayers,
      updateLayer,
      moveLayer,
      selectAllLayers,
      deselectAllLayers,
    ]
  );

  // Group management shortcuts temporarily disabled to resolve runtime error
  // TODO: Re-enable when group functions are properly implemented
  /*
  const groupShortcuts = useMemo(() => [
    {
      key: 'g',
      ctrl: true,
      action: () => {
        // Group functionality temporarily disabled      },
      description: 'Group selected layers (Ctrl+G) - Coming Soon'
    }
  ], []);
  */

  useKeyboardShortcuts(shortcuts, [shortcuts]);

  // Memoized computed values for better performance
  const selectedLayer = useMemo(
    () => managedLayers.find(l => l.id === selectedLayerId),
    [managedLayers, selectedLayerId]
  );

  const reversedLayers = useMemo(
    () => [...managedLayers].reverse(),
    [managedLayers]
  );

  // Memoized className computations
  const themeClasses = useMemo(
    () => ({
      buttonAction:
        theme === 'frost_light'
          ? 'frostlight-button-action'
          : 'frostdark-button-action',
      buttonActionSm:
        theme === 'frost_light'
          ? 'frostlight-button-action frostlight-button-action-sm'
          : 'frostdark-button-action frostdark-button-action-sm',
      buttonActionDanger:
        theme === 'frost_light'
          ? 'frostlight-button-action-danger frostlight-button-action-sm'
          : 'frostdark-button-action-danger frostdark-button-action-sm',
      appContentCard:
        theme === 'frost_light'
          ? 'frostlight-app-content-card'
          : 'frostdark-app-content-card',
      appCardTitle:
        theme === 'frost_light'
          ? 'frostlight-app-card-title'
          : 'frostdark-app-card-title',
      inputField:
        theme === 'frost_light'
          ? 'frostlight-input-field'
          : 'frostdark-input-field',
      inputContainer:
        theme === 'frost_light'
          ? 'frostlight-input-container'
          : 'frostdark-input-container',
      standardGlassCard:
        theme === 'frost_light'
          ? 'frostlight-standard-glass-card'
          : 'frostdark-standard-glass-card',
    }),
    [theme]
  );

  return (
    <div
      className={`hal-demo ${theme}`}
      style={{
        paddingBottom: showAnimationPanel ? timelinePanelHeight : 0,
      }}
    >
      <HalInterface
        layers={managedLayers}
        isActive={isActive}
        audioData={audioData}
        onHalClick={handleHalClick}
        theme={theme}
        debugOverlay={debugOverlay}
        showControls={showControls}
        setShowControls={setShowControls}
        setDebugOverlay={setDebugOverlay}
        onThemeToggle={onThemeToggle}
        onAddLayers={addLayers}
        onUpdateLayer={updateLayer}
      />

      {/* Control Panel */}
      {showControls && (
        <div
          className={`${theme} sidebar`}
          role='complementary'
          aria-label='Layer controls'
        >
          <div
            className='resize-handle'
            aria-label='Resize controls panel'
          ></div>
          <div style={{ padding: '1rem', paddingTop: '0' }}>
            <div
              className={`frost-flex frost-items-center frost-justify-between frost-mb-3 frost-pb-2 border-b`}
            >
              <h1 className={themeClasses.appCardTitle}>Layer Controls</h1>
              <div className='frost-flex frost-items-center frost-gap-2'>
                <button
                  onClick={async () => {
                    if (window.electronAPI?.createWidget) {
                      const success = await window.electronAPI.createWidget();
                      if (success) {
                        console.log('Widget created successfully');
                      } else {
                        console.warn('Failed to create widget');
                      }
                    } else {
                      console.warn('Widget mode only available in Electron');
                      alert(
                        'Widget mode is only available in the desktop app. Please use "npm run electron:dev" to run HAL in Electron mode.'
                      );
                    }
                  }}
                  className={`
                    ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}
                    frost-transition
                  `}
                  title='Launch Widget Mode - Floating visual event monitor'
                >
                  🪟
                </button>
                <button
                  onClick={onThemeToggle}
                  className={`
                    ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}
                    frost-transition
                  `}
                  title={`Switch to ${theme === 'frost_light' ? 'dark' : 'light'} theme`}
                >
                  {theme === 'frost_light' ? '🌙' : '☀️'}
                </button>
                <button
                  onClick={() => setShowAnimationPanel(prev => !prev)}
                  className={`
                    ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}
                    frost-transition
                  `}
                  aria-pressed={showAnimationPanel}
                  aria-label={`${showAnimationPanel ? 'Hide' : 'Show'} Animation Studio panel`}
                  title={`${showAnimationPanel ? 'Hide' : 'Show'} Animation Studio panel`}
                >
                  🎬
                </button>
              </div>
            </div>

            {/* Preset Controls */}
            <div
              className={`${theme === 'frost_light' ? 'frostlight-app-content-card' : 'frostdark-app-content-card'} frost-mb-4`}
            >
              <h3 className='frost-mb-2 frost-text-primary'>Presets</h3>

              <div className='frost-flex frost-gap-2 frost-mb-2'>
                <button
                  onClick={() => setShowPresetDialog(true)}
                  className={`frost-flex-1 ${themeClasses.buttonAction}`}
                >
                  Save Current
                </button>
                <label className='frost-flex-1 frost-text-primary'>
                  <input
                    ref={presetFileInputRef}
                    type='file'
                    accept='.json'
                    onChange={e => {
                      importPreset(e).catch(console.error);
                    }}
                    className='frost-hidden'
                  />
                  <span
                    className={`${theme === 'frost_light' ? 'frostlight-button-action' : 'frostdark-button-action'}`}
                  >
                    Import
                  </span>
                </label>
              </div>

              {showPresetDialog && (
                <div
                  className={`frost-mb-2 frost-p-2 ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}`}
                >
                  <input
                    type='text'
                    value={presetName}
                    onChange={e => setPresetName(e.target.value)}
                    placeholder='Preset name...'
                    className={`frost-w-full frost-mb-2 ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}`}
                  />
                  <div className='frost-flex frost-gap-2'>
                    <button
                      onClick={async () => {
                        if (presetName.trim()) {
                          const success = await savePresetToStorage(
                            managedLayers,
                            presetName.trim()
                          );
                          if (success) {
                            setPresetName('');
                            setShowPresetDialog(false);
                          }
                        }
                      }}
                      className={`frost-flex-1 ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowPresetDialog(false);
                        setPresetName('');
                      }}
                      className={`frost-flex-1 ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className='frost-flex frost-flex-col frost-gap-1'>
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`frost-flex frost-items-center frost-gap-1 frost-p-1 ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}`}
                  >
                    <button
                      onClick={() => {
                        const loadedLayers = loadPresetFromStorage(preset);
                        setLayers(loadedLayers);
                      }}
                      className={`frost-flex-1 ${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}`}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => exportPreset(preset)}
                      className={`${theme === 'frost_light' ? 'frostlight-button-action frostlight-button-action-sm' : 'frostdark-button-action frostdark-button-action-sm'}`}
                      title='Export'
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className={`${theme === 'frost_light' ? 'frostlight-button-action-danger frostlight-button-action-sm' : 'frostdark-button-action-danger frostdark-button-action-sm'}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Layer Controls */}
            <div
              className={`${theme === 'frost_light' ? 'frostlight-app-content-card' : 'frostdark-app-content-card'} frost-mb-4`}
            >
              <h3 className='frost-mb-2 frost-text-primary'>Add New Layer</h3>

              <div className='frost-flex frost-gap-2'>
                <div
                  className={`${theme === 'frost_light' ? 'frostlight-input-container' : 'frostdark-input-container'} frost-flex-1`}
                >
                  <select
                    value={newLayerType}
                    onChange={e =>
                      setNewLayerType(e.target.value as Layer['type'])
                    }
                    className={`${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}`}
                  >
                    <option value='shape'>🔷 Shape</option>
                    <option value='image'>🖼️ Image</option>
                    <option value='equalizer'>🎵 Equalizer</option>
                    <option value='radialText'>📝 Radial Text</option>
                    <option value='audio'>🔊 Audio</option>
                    <option value='asset-generator'>✨ Asset Generator</option>
                  </select>
                </div>
                <button
                  onClick={addNewLayer}
                  className={themeClasses.buttonAction}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Layer List */}
            <div
              className={`${theme === 'frost_light' ? 'frostlight-app-content-card' : 'frostdark-app-content-card'} control-section`}
            >
              {reversedLayers.map((layer, reverseIndex) => {
                const actualIndex = managedLayers.length - 1 - reverseIndex;
                // const layerGroup = layer.groupId ? layerGroups.find(g => g.id === layer.groupId) : undefined;
                return (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    actualIndex={actualIndex}
                    layerCount={managedLayers.length}
                    selectedLayerId={selectedLayerId}
                    updateLayer={updateLayer}
                    moveLayer={moveLayer}
                    setSelectedLayerId={setSelectedLayerId}
                    duplicateLayer={duplicateLayer}
                    deleteLayer={deleteLayer}
                    renameLayer={renameLayer}
                    addGradientColor={layerId =>
                      addGradientColor(layerId, updateLayer, managedLayers)
                    }
                    removeGradientColor={(layerId, index) =>
                      removeGradientColor(
                        layerId,
                        index,
                        updateLayer,
                        managedLayers
                      )
                    }
                    updateGradientColor={(layerId, index, color) =>
                      updateGradientColor(
                        layerId,
                        index,
                        color,
                        updateLayer,
                        managedLayers
                      )
                    }
                    updateGradientStop={(layerId, index, stop) =>
                      updateGradientStop(
                        layerId,
                        index,
                        stop,
                        updateLayer,
                        managedLayers
                      )
                    }
                    onShapeTypeChange={handleShapeTypeChange}
                    theme={theme}
                    onLayerClick={handleLayerClick}
                    isMultiSelected={multiSelectedLayers.has(layer.id)}
                    isExpanded={expandedLayers.has(layer.id)}
                    onToggleExpanded={toggleLayerExpanded}
                    groupName={undefined}
                    onGroupLayers={undefined}
                    onUngroupLayers={undefined}
                    onAddLayers={addLayers}
                    layers={managedLayers}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor isVisible={showPerformanceMonitor} />

      {/* Animation Timeline Bottom Panel */}
      {showAnimationPanel && (
        <AnimationBottomPanel
          layers={managedLayers}
          onAddLayers={addLayers}
          onUpdateLayer={updateLayer}
          theme={theme}
          height={timelinePanelHeight}
          onHeightChange={(h: number) =>
            setTimelinePanelHeight(clampPanelHeight(h))
          }
        />
      )}
    </div>
  );
}

export default HalModuleBuilder;
