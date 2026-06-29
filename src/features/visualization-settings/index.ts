/**
 * Visualization Settings Feature - Public API
 * Single Responsibility: Export public interface for the feature
 */

// Types
export type {
  AppearancePanelMapping,
  BarLayoutMode,
  BarStyleSettings,
  BarVisualizationSettings,
  BlockAlignment,
  CircleStyleSettings,
  CircleVisualizationSettings,
  ColorMode,
  CommonVisualizationSettings,
  DiamondStyleSettings,
  DiamondVisualizationSettings,
  DotStyleSettings,
  DotVisualizationSettings,
  HexagonStyleSettings,
  HexagonVisualizationSettings,
  LayoutType,
  PulseMode,
  RadialOrientation,
  SectionProps,
  SymmetryMode,
  TriangleStyleSettings,
  TriangleVisualizationSettings,
  VisualizationSettings,
  VisualizationType,
} from './types';

// Defaults
export {
  DEFAULT_BAR_SETTINGS,
  DEFAULT_BAR_STYLE,
  DEFAULT_CIRCLE_SETTINGS,
  DEFAULT_CIRCLE_STYLE,
  DEFAULT_COMMON_SETTINGS,
  DEFAULT_DIAMOND_SETTINGS,
  DEFAULT_DIAMOND_STYLE,
  DEFAULT_DOT_SETTINGS,
  DEFAULT_DOT_STYLE,
  DEFAULT_HEXAGON_SETTINGS,
  DEFAULT_HEXAGON_STYLE,
  DEFAULT_TRIANGLE_SETTINGS,
  DEFAULT_TRIANGLE_STYLE,
  getDefaultSettings,
} from './utils/settings-defaults';

// Schema and validation
export {
  BAR_CONSTRAINTS,
  CIRCLE_CONSTRAINTS,
  COMMON_CONSTRAINTS,
  DIAMOND_CONSTRAINTS,
  DOT_CONSTRAINTS,
  HEXAGON_CONSTRAINTS,
  TRIANGLE_CONSTRAINTS,
  clamp,
  validateSetting,
} from './utils/settings-schema';

// Hooks
export {
  useVisualizationSettings,
  type UseVisualizationSettingsProps,
  type UseVisualizationSettingsReturn,
} from './hooks/useVisualizationSettings';

export {
  useAppearanceMapping,
  type UseAppearanceMappingProps,
  type UseAppearanceMappingReturn,
} from './hooks/useAppearanceMapping';

// Components
export {
  VisualizationSettingsPanel,
  type VisualizationSettingsPanelProps,
} from './components/VisualizationSettingsPanel';

// Shared sections
export {
  AppearanceSection,
  AudioIntegrationSection,
  PositionSection,
  SymmetrySection,
} from './components/shared-sections';

// Style sections
export {
  BarStyleSection,
  CircleStyleSection,
  DiamondStyleSection,
  DotStyleSection,
  HexagonStyleSection,
  TriangleStyleSection,
} from './components/style-sections';
