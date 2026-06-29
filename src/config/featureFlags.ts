export interface FeatureFlags {
  ADVANCED_LAYER_MANAGEMENT: boolean;
}

const FEATURE_FLAGS: FeatureFlags = {
  ADVANCED_LAYER_MANAGEMENT: false,
};

export const isAdvancedLayerManagementEnabled = (): boolean =>
  FEATURE_FLAGS.ADVANCED_LAYER_MANAGEMENT;

export const enableAdvancedLayerManagement = (): void => {
  FEATURE_FLAGS.ADVANCED_LAYER_MANAGEMENT = true;
};

export const disableAdvancedLayerManagement = (): void => {
  FEATURE_FLAGS.ADVANCED_LAYER_MANAGEMENT = false;
};
