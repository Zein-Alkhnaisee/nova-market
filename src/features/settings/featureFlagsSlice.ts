import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import { defaultFeatureFlags, type FeatureFlagKey, type FeatureFlags } from "../../config/features";

interface FeatureFlagsState {
  overrides: Partial<FeatureFlags>;
}

const initialState: FeatureFlagsState = {
  overrides: loadPersisted<Partial<FeatureFlags>>("featureFlagOverrides", {}),
};

const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    setFeatureFlag: (state, action: PayloadAction<{ key: FeatureFlagKey; enabled: boolean }>) => {
      state.overrides[action.payload.key] = action.payload.enabled;
    },
    resetFeatureFlags: (state) => {
      state.overrides = {};
    },
  },
});

export const { setFeatureFlag, resetFeatureFlags } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;

export const selectFeatureFlags = (state: { featureFlags: FeatureFlagsState }): FeatureFlags => ({
  ...defaultFeatureFlags,
  ...state.featureFlags.overrides,
});

export const selectFeatureFlag =
  (key: FeatureFlagKey) =>
  (state: { featureFlags: FeatureFlagsState }): boolean =>
    state.featureFlags.overrides[key] ?? defaultFeatureFlags[key];
