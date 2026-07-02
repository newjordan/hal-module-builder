import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeEffectsLibrary } from './assets/effects';
import ErrorBoundary from './components/ErrorBoundary';
import {
  ModeProvider,
  useMode,
  ModeBar,
  PresentMode,
  DesignMode,
} from './modes';
import { ImageStore } from './services/ImageStore';
import { DEFAULT_HAL_LAYERS } from './config/defaultHalDesign';

// Default design when no saved layers exist — the signature HAL eye
const DEFAULT_LAYERS = DEFAULT_HAL_LAYERS;

/** Read layers from localStorage synchronously (no images — just metadata) */
function loadLayersFromStorage() {
  try {
    const saved = localStorage.getItem('hal-layers');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((l: any) =>
          l.src && typeof l.src === 'string' && l.src.startsWith('idb:')
            ? { ...l, src: '' }
            : l
        );
      }
    }
  } catch {}
  return DEFAULT_LAYERS;
}

// Mode Router - renders the appropriate mode
function ModeRouter({
  theme,
}: {
  theme: 'frost_light' | 'frost_dark';
  onThemeToggle: () => void;
}) {
  const { mode } = useMode();

  // Synchronously load layer metadata from localStorage every time mode changes.
  // This guarantees PresentMode renders the correct design on the FIRST frame.
  const layerMetadata = useMemo(() => loadLayersFromStorage(), [mode]);

  // State holds layers with images restored from IndexedDB
  const [savedLayers, setSavedLayers] = useState(layerMetadata);

  // When mode changes: push the fresh metadata into state, then async-restore images
  useEffect(() => {
    setSavedLayers(layerMetadata);

    let cancelled = false;
    ImageStore.loadAll()
      .then(images => {
        if (cancelled || Object.keys(images).length === 0) return;
        setSavedLayers(prev =>
          prev.map(l => {
            if (l.type === 'image' && !l.src && images[l.id]) {
              return { ...l, src: images[l.id] as string };
            }
            return l;
          })
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [layerMetadata]);

  switch (mode) {
    case 'present':
      return <PresentMode layers={savedLayers} theme={theme} />;

    case 'design':
      return <DesignMode />;

    default:
      return <DesignMode />;
  }
}

// Main App Shell
function AppShell({
  theme,
  onThemeToggle,
}: {
  theme: 'frost_light' | 'frost_dark';
  onThemeToggle: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Mode bar - minimal in present mode */}
      <ModeBar />

      {/* Main content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Mode Error:', error, errorInfo);
          }}
        >
          <ModeRouter theme={theme} onThemeToggle={onThemeToggle} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<'frost_light' | 'frost_dark'>(
    'frost_dark'
  );

  // Load theme from localStorage on mount and initialize effects library
  useEffect(() => {
    const savedTheme = localStorage.getItem('hal-theme') as
      | 'frost_light'
      | 'frost_dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Initialize effects library
    try {
      initializeEffectsLibrary();
    } catch (error) {
      console.error('Failed to initialize effects library:', error);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    requestAnimationFrame(() => {
      document.body.className = theme;
      document.documentElement.style.colorScheme =
        theme === 'frost_light' ? 'light' : 'dark';
    });

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        localStorage.setItem('hal-theme', theme);
      });
    } else {
      setTimeout(() => {
        localStorage.setItem('hal-theme', theme);
      }, 0);
    }
  }, [theme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      import('./utils/ImageMemoryManager')
        .then(({ imageMemoryManager }) => {
          imageMemoryManager.dispose();
        })
        .catch(() => {});

      import('./services/AudioService')
        .then(({ disposeAudioService }) => {
          disposeAudioService();
        })
        .catch(() => {});

      import('./resize-panel.js')
        .then(({ cleanupResizablePanel }) => {
          cleanupResizablePanel();
        })
        .catch(() => {});

      document.body.className = '';

      if (window.gc && typeof window.gc === 'function') {
        window.gc();
      }
    };
  }, []);

  const toggleTheme = () => {
    document.body.classList.add('theme-transitioning');
    setTheme(prev => (prev === 'frost_light' ? 'frost_dark' : 'frost_light'));
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  };

  return (
    <ErrorBoundary
      resetKeys={[theme]}
      resetOnPropsChange={true}
      onError={(error, errorInfo) => {
        console.error('App Error Context:', error, errorInfo);
      }}
    >
      <ModeProvider defaultMode='design'>
        <Router>
          <div className={theme}>
            <Routes>
              {/* Main app route - mode-based rendering */}
              <Route
                path='/'
                element={<AppShell theme={theme} onThemeToggle={toggleTheme} />}
              />
            </Routes>
          </div>
        </Router>
      </ModeProvider>
    </ErrorBoundary>
  );
}

export default App;
