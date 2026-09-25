import { describe, expect, it } from "vitest";
import featureFlagsReducer, {
  setFeatureFlag,
  resetFeatureFlags,
  selectFeatureFlag,
  selectFeatureFlags,
} from "../../features/settings/featureFlagsSlice";
import { defaultFeatureFlags } from "../../config/features";

describe("featureFlagsSlice", () => {
  it("defaults every flag to its config default with no overrides", () => {
    const state = featureFlagsReducer(undefined, { type: "@@init" });
    expect(selectFeatureFlags({ featureFlags: state })).toEqual(defaultFeatureFlags);
  });

  it("overrides a single flag without affecting the others", () => {
    const state = featureFlagsReducer(
      undefined,
      setFeatureFlag({ key: "productConfigurator", enabled: false })
    );
    expect(selectFeatureFlag("productConfigurator")({ featureFlags: state })).toBe(false);
    expect(selectFeatureFlag("commandPalette")({ featureFlags: state })).toBe(
      defaultFeatureFlags.commandPalette
    );
  });

  it("resetFeatureFlags clears all overrides back to defaults", () => {
    let state = featureFlagsReducer(undefined, setFeatureFlag({ key: "aiAssistant", enabled: false }));
    state = featureFlagsReducer(state, setFeatureFlag({ key: "smartRecommendations", enabled: false }));
    state = featureFlagsReducer(state, resetFeatureFlags());
    expect(selectFeatureFlags({ featureFlags: state })).toEqual(defaultFeatureFlags);
  });

  it("can toggle a flag back on after turning it off", () => {
    let state = featureFlagsReducer(undefined, setFeatureFlag({ key: "productComparison", enabled: false }));
    state = featureFlagsReducer(state, setFeatureFlag({ key: "productComparison", enabled: true }));
    expect(selectFeatureFlag("productComparison")({ featureFlags: state })).toBe(true);
  });
});
