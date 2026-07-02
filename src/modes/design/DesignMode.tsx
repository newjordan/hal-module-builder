import React, { Suspense, lazy, useMemo } from 'react';
import { DesignLayout, DesignLayoutProvider } from './DesignLayout';
import { LayersPanel } from './panels/LayersPanel';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { useLayerManagement } from '../../hooks/useLayerManagement';
import { useAudioContext } from '../../hooks/useAudioContext';
import { useTemplates } from '../../hooks/useTemplates';
import { ImageStore } from '../../services/ImageStore';
import type { Layer, Preset } from '../../types';

// Lazy load HalComposite for the canvas preview
const HalComposite = lazy(() =>
  import('../../components/HalComposite/HalComposite').then(module => ({
    default: module.HalComposite,
  }))
);

interface DesignModeProps {
  className?: string;
}

import { DEFAULT_HAL_LAYERS } from '../../config/defaultHalDesign';

// Default starting design for new sessions — the signature HAL eye
const DEFAULT_LAYERS: Layer[] = DEFAULT_HAL_LAYERS;

/** Persist layers: images to IndexedDB, metadata to localStorage */
function saveLayersToStorage(layers: Layer[]) {
  if (layers.length === 0) return;

  // Save images to IndexedDB (async, won't block)
  for (const l of layers) {
    if (l.type === 'image' && l.src && l.src.startsWith('data:')) {
      ImageStore.save(l.id, l.src).catch(() => {});
    }
  }

  // Save layer metadata (without base64 blobs) to localStorage
  try {
    const saveable = layers.map(l =>
      l.src && l.src.startsWith('data:') ? { ...l, src: `idb:${l.id}` } : l
    );
    localStorage.setItem('hal-layers', JSON.stringify(saveable));
  } catch {
    try {
      const minimal = layers.map(l => (l.src ? { ...l, src: '' } : l));
      localStorage.setItem('hal-layers', JSON.stringify(minimal));
    } catch {
      console.error('Cannot save layers to localStorage');
    }
  }
}

export function DesignMode({ className = '' }: DesignModeProps) {
  // Initialize layer management from localStorage or defaults
  // Images marked with idb: prefix will be restored from IndexedDB in a separate effect
  const initialLayers = useMemo(() => {
    try {
      const saved = localStorage.getItem('hal-layers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clear idb: markers — actual src will be restored from IndexedDB
          return parsed.map((l: any) =>
            l.src && typeof l.src === 'string' && l.src.startsWith('idb:')
              ? { ...l, src: '' }
              : l
          );
        }
      }
    } catch {}
    return DEFAULT_LAYERS;
  }, []);

  const {
    layers,
    selectedLayerId,
    setLayers,
    addNewLayer,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
    setSelectedLayerId,
  } = useLayerManagement(initialLayers, '');

  // Template/preset management
  const {
    presets,
    savePreset,
    loadPreset,
    deletePreset: deleteTemplate,
    exportPreset,
    importPreset,
  } = useTemplates();

  // Audio context for visualizations
  const { audioData, isActive, toggleAudio } = useAudioContext(layers, {
    fftSize: 128,
  });

  // Selected layer for properties panel
  const selectedLayer = useMemo(
    () => layers.find(l => l.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  // Restore images from IndexedDB on mount
  React.useEffect(() => {
    ImageStore.loadAll()
      .then(images => {
        if (Object.keys(images).length === 0) return;
        setLayers((prev: Layer[]) =>
          prev.map(l => {
            if (l.type === 'image' && !l.src && images[l.id]) {
              return { ...l, src: images[l.id] as string };
            }
            return l;
          })
        );
      })
      .catch(() => {});
  }, []);

  // Keep a ref to the latest layers so the unmount cleanup can access them
  const layersRef = React.useRef(layers);
  layersRef.current = layers;

  // Save layers: metadata to localStorage, images to IndexedDB
  React.useEffect(() => {
    saveLayersToStorage(layers);
  }, [layers]);

  // Also save on unmount so mode switches always have the latest data
  React.useEffect(() => {
    return () => saveLayersToStorage(layersRef.current);
  }, []);

  // Handle adding layers with specific type
  const handleAddLayer = React.useCallback(
    (type: Layer['type']) => {
      addNewLayer(type);
    },
    [addNewLayer]
  );

  // Handle visibility toggle
  const handleToggleVisibility = React.useCallback(
    (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        updateLayer(layerId, { visible: !layer.visible });
      }
    },
    [layers, updateLayer]
  );

  // Save/Load handlers
  const handleSaveDesign = React.useCallback(async () => {
    const name = prompt('Design name:');
    if (!name?.trim()) return;
    const ok = await savePreset(layers, name.trim());
    if (ok) console.log(`Saved design "${name.trim()}"`);
  }, [layers, savePreset]);

  const handleLoadDesign = React.useCallback(
    (preset: Preset) => {
      const loaded = loadPreset(preset);
      if (loaded.length > 0) {
        setLayers(loaded);
        setSelectedLayerId('');
      }
    },
    [loadPreset, setLayers, setSelectedLayerId]
  );

  const handleExportFile = React.useCallback(() => {
    const preset: Preset = {
      id: 'export_' + Date.now(),
      name: 'Exported Design',
      timestamp: Date.now(),
      layers,
    };
    exportPreset(preset, 'json');
  }, [layers, exportPreset]);

  const handleImportFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ok = await importPreset(e);
      if (ok) {
        // Reload presets are handled by useTemplates internally
        // Load the most recently imported one
        // For now just notify
        console.log('Design imported — check Load menu');
      }
    },
    [importPreset]
  );

  // Keyboard shortcuts: Ctrl+S to save, Ctrl+Shift+S to export
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleExportFile();
        } else {
          handleSaveDesign();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveDesign, handleExportFile]);

  return (
    <DesignLayoutProvider>
      <div className={`design-mode ${className}`} style={{ height: '100%' }}>
        <DesignLayout
          leftPanel={
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onToggleVisibility={handleToggleVisibility}
              onAddLayer={handleAddLayer}
              onDeleteLayer={deleteLayer}
              onDuplicateLayer={duplicateLayer}
              onMoveLayer={moveLayer}
            />
          }
          rightPanel={
            <PropertiesPanel
              selectedLayer={selectedLayer}
              onUpdateLayer={updateLayer}
            />
          }
        >
          {/* Center Canvas Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background:
                'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
              position: 'relative',
            }}
          >
            {/* Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Left: File operations */}
              <FileMenu
                presets={presets}
                onSave={handleSaveDesign}
                onLoad={handleLoadDesign}
                onExport={handleExportFile}
                onImport={handleImportFile}
                onDelete={deleteTemplate}
              />

              {/* Center: Audio toggle */}
              <button
                onClick={toggleAudio}
                style={{
                  padding: '6px 16px',
                  background: isActive
                    ? 'rgba(100, 200, 100, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${isActive ? 'rgba(100, 200, 100, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 6,
                  color: isActive ? '#90EE90' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                {isActive ? '🎵 Audio Active' : '🔇 Enable Audio'}
              </button>

              {/* Right: spacer */}
              <div style={{ width: 160 }} />
            </div>

            {/* Canvas */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Suspense
                fallback={
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: 14,
                    }}
                  >
                    Loading canvas...
                  </div>
                }
              >
                <HalComposite
                  layers={layers}
                  audioData={audioData}
                  isActive={isActive}
                  size={500}
                  theme='frost_dark'
                  onClick={toggleAudio}
                  onUpdateLayer={updateLayer}
                />
              </Suspense>
            </div>

            {/* Status bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <span>
                {layers.length} layer{layers.length !== 1 ? 's' : ''}
              </span>
              <span>
                {selectedLayer
                  ? `Selected: ${selectedLayer.name}`
                  : 'No selection'}
              </span>
            </div>
          </div>
        </DesignLayout>
      </div>
    </DesignLayoutProvider>
  );
}

// ── File Menu Component ────────────────────────────────────────
const toolbarBtn: React.CSSProperties = {
  padding: '5px 10px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  color: 'rgba(255, 255, 255, 0.7)',
  cursor: 'pointer',
  fontSize: 12,
  whiteSpace: 'nowrap',
};

function FileMenu({
  presets,
  onSave,
  onLoad,
  onExport,
  onImport,
  onDelete,
}: {
  presets: Preset[];
  onSave: () => void;
  onLoad: (preset: Preset) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [showLoad, setShowLoad] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Save */}
      <button onClick={onSave} style={toolbarBtn} title='Save design (Ctrl+S)'>
        Save
      </button>

      {/* Load dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowLoad(!showLoad)}
          style={toolbarBtn}
          title='Load a saved design'
        >
          Load {presets.length > 0 ? `(${presets.length})` : ''}
        </button>

        {showLoad && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 199 }}
              onClick={() => setShowLoad(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'rgba(30, 30, 35, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: 4,
                zIndex: 200,
                minWidth: 220,
                maxHeight: 320,
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
            >
              {presets.length === 0 ? (
                <div
                  style={{
                    padding: '16px 12px',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  No saved designs yet.
                  <br />
                  Click Save to create one.
                </div>
              ) : (
                presets
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map(preset => (
                    <div
                      key={preset.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 8px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 12,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{ flex: 1, overflow: 'hidden' }}
                        onClick={() => {
                          onLoad(preset);
                          setShowLoad(false);
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {preset.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255, 255, 255, 0.35)',
                          }}
                        >
                          {preset.layers.length} layer
                          {preset.layers.length !== 1 ? 's' : ''}
                          {' \u00b7 '}
                          {new Date(preset.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          if (confirm(`Delete "${preset.name}"?`)) {
                            await onDelete(preset.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 100, 100, 0.5)',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: '2px 4px',
                          borderRadius: 3,
                        }}
                        title='Delete'
                      >
                        \u00d7
                      </button>
                    </div>
                  ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Export */}
      <button
        onClick={onExport}
        style={toolbarBtn}
        title='Export to JSON file (Ctrl+Shift+S)'
      >
        Export
      </button>

      {/* Import */}
      <input
        ref={importRef}
        type='file'
        accept='.json'
        style={{ display: 'none' }}
        onChange={e => {
          onImport(e);
          if (importRef.current) importRef.current.value = '';
        }}
      />
      <button
        onClick={() => importRef.current?.click()}
        style={toolbarBtn}
        title='Import from JSON file'
      >
        Import
      </button>
    </div>
  );
}
