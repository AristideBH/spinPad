// ═══════════════════════════════════════════════════════════════
//  store/featureFlags.svelte.ts — Dev-only Studio features
//
//  Features listed here are hidden from regular users by default.
//  Visit ?dev=1 once to enable them (persisted via localStorage),
//  or ?dev=0 to disable again. Promote a feature to public by
//  flipping its default to true; eventually delete the flag and
//  the {#if} wrapper at its call site(s).
// ═══════════════════════════════════════════════════════════════

const DEV_FEATURE_DEFAULTS = {
  batteryPresenceDetection: false,
  profileIconEditing: true,
  iconEditorTools: false,
  testMode: false,
};

type DevFeature = keyof typeof DEV_FEATURE_DEFAULTS;

const STORAGE_KEY = 'spinpad:devFeatures';

function readOverrides(): Partial<Record<DevFeature, boolean>> {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

class FeatureFlagsState {
  batteryPresenceDetection = $state(DEV_FEATURE_DEFAULTS.batteryPresenceDetection);
  profileIconEditing = $state(DEV_FEATURE_DEFAULTS.profileIconEditing);
  iconEditorTools = $state(DEV_FEATURE_DEFAULTS.iconEditorTools);
  testMode = $state(DEV_FEATURE_DEFAULTS.testMode);

  constructor() {
    Object.assign(this, readOverrides());
  }

  /** Reads ?dev=1 / ?dev=0 from the given URL once and persists the override. */
  applyFromUrl(url: URL) {
    const dev = url.searchParams.get('dev');
    if (dev === null) return;
    const enabled = dev === '1';
    const overrides = Object.fromEntries(Object.keys(DEV_FEATURE_DEFAULTS).map((key) => [key, enabled])) as Record<
      DevFeature,
      boolean
    >;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    Object.assign(this, overrides);
  }
}

export const featureFlags = new FeatureFlagsState();
