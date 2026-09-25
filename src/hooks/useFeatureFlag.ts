import { useAppSelector } from "../app/store/hooks";
import { selectFeatureFlag } from "../features/settings/featureFlagsSlice";
import type { FeatureFlagKey } from "../config/features";

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  return useAppSelector(selectFeatureFlag(key));
}
