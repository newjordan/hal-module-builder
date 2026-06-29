/**
 * Orchestration Layer - Layer 4 of the SRP Reactive UI Architecture
 *
 * These components manage the coordination between visualization panels:
 * - Router determines which panel to show
 * - State manager handles centralized settings state
 * - Validator ensures settings are compatible and valid
 */

export { VisualizationSettingsRouter } from './VisualizationSettingsRouter';
export type {
  VisualizationSettingsRouterProps,
  VisualizationType,
} from './VisualizationSettingsRouter';

export {
  SettingsStateProvider,
  useSettingsState,
} from './SettingsStateManager';
export type {
  VisualizationSettings,
  SettingsState,
  SettingsAction,
} from './SettingsStateManager';

export {
  SettingsValidator,
  SettingsValidationEngine,
} from './SettingsValidator';
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SettingsValidatorProps,
} from './SettingsValidator';
