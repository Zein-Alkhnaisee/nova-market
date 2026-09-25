/**
 * Centralized feature flag definitions (MASTER_SPEC §81/§82).
 *
 * Flags default to `true` here — every flagged feature already ships as
 * part of the normal experience — but can be turned off per-browser from
 * Settings → Experimental features, which is what actually exercises the
 * on/off branches in the app rather than the flags being a list nobody reads.
 *
 * This is deliberately a plain object, not an env-driven system: there is no
 * server to fetch remote flag values from in this demo. A real backend would
 * replace `defaultFeatureFlags` + the persisted override with a fetched
 * config, without changing `useFeatureFlag`'s call sites.
 */
export type FeatureFlagKey =
  | "aiAssistant"
  | "productComparison"
  | "smartRecommendations"
  | "productConfigurator"
  | "commandPalette";

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const defaultFeatureFlags: FeatureFlags = {
  aiAssistant: true,
  productComparison: true,
  smartRecommendations: true,
  productConfigurator: true,
  commandPalette: true,
};

export const featureFlagKeys = Object.keys(defaultFeatureFlags) as FeatureFlagKey[];
