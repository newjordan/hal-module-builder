/**
 * SettingsStateManager - Manages visualization settings state
 * Single Responsibility: Centralizes settings state management and updates
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react';

export interface VisualizationSettings {
  // Common base settings
  barCount: number;
  primaryColor: string;
  secondaryColor?: string;
  glowColor?: string;
  colorMode:
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'reactive'
    | 'custom-gradient'
    | 'radial-gradient';
  responseSpeed: number;
  frequencyRange: 'bass' | 'mid' | 'treble' | 'full';
  glowIntensity: number;
  pulseMode: 'none' | 'subtle' | 'strong';
  maxHeight: number;
  opacity?: number;

  // Layout
  layout?: 'linear' | 'radial' | 'grid';

  // Radial layout
  innerRadius: number;
  startAngle: number;
  endAngle: number;
  arcMode: boolean;
  radialOrientation: 'follow-radius' | 'follow-tangent' | 'maintain';
  radialSizingMode?: 'flat' | 'depth';

  // Type-specific settings (will be extended)
  [key: string]: any;
}

export interface SettingsState {
  settings: VisualizationSettings;
  isDirty: boolean;
  history: VisualizationSettings[];
  historyIndex: number;
}

export type SettingsAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<VisualizationSettings> }
  | { type: 'RESET_SETTINGS'; payload: VisualizationSettings }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_CLEAN' };

const DEFAULT_SETTINGS: VisualizationSettings = {
  barCount: 64,
  primaryColor: '#00ffff',
  secondaryColor: '#ff00ff',
  glowColor: '#ffffff',
  colorMode: 'solid',
  responseSpeed: 1,
  frequencyRange: 'full',
  glowIntensity: 0.5,
  pulseMode: 'none',
  maxHeight: 80,
  opacity: 1,
  layout: 'radial',
  innerRadius: 30,
  startAngle: 0,
  endAngle: 360,
  arcMode: false,
  radialOrientation: 'follow-radius',
  radialSizingMode: 'flat',
};

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };

      try {
        if (Object.prototype.hasOwnProperty.call(action.payload, 'invert')) {
          console.debug('[State][SettingsReducer] UPDATE_SETTINGS', {
            payloadInvert: (action.payload as any).invert,
            mergedInvert: (newSettings as any).invert,
          });
        }
      } catch {}

      // Add to history if this is a significant change
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newSettings);

      // Limit history to 20 entries
      if (newHistory.length > 20) {
        newHistory.shift();
      }

      return {
        ...state,
        settings: newSettings,
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'RESET_SETTINGS':
      return {
        settings: action.payload,
        isDirty: false,
        history: [action.payload],
        historyIndex: 0,
      };

    case 'UNDO':
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const previousSettings = state.history[newIndex];
        return {
          ...state,
          settings: previousSettings ?? state.settings,
          historyIndex: newIndex,
          isDirty: true,
        };
      }
      return state;

    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const previousSettings = state.history[newIndex];
        return {
          ...state,
          settings: previousSettings ?? state.settings,
          historyIndex: newIndex,
          isDirty: true,
        };
      }
      return state;

    case 'MARK_CLEAN':
      return {
        ...state,
        isDirty: false,
      };

    default:
      return state;
  }
};

interface SettingsContextType {
  state: SettingsState;
  updateSettings: (updates: Partial<VisualizationSettings>) => void;
  resetSettings: (newSettings: VisualizationSettings) => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsState = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettingsState must be used within a SettingsStateProvider'
    );
  }
  return context;
};

interface SettingsStateProviderProps {
  children: React.ReactNode;
  initialSettings?: Partial<VisualizationSettings>;
}

export const SettingsStateProvider: React.FC<SettingsStateProviderProps> = ({
  children,
  initialSettings = {},
}) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    settings: { ...DEFAULT_SETTINGS, ...initialSettings },
    isDirty: false,
    history: [{ ...DEFAULT_SETTINGS, ...initialSettings }],
    historyIndex: 0,
  });

  const updateSettings = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
    },
    []
  );

  const resetSettings = useCallback((newSettings: VisualizationSettings) => {
    dispatch({ type: 'RESET_SETTINGS', payload: newSettings });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const markClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' });
  }, []);

  const value: SettingsContextType = {
    state,
    updateSettings,
    resetSettings,
    undo,
    redo,
    markClean,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
