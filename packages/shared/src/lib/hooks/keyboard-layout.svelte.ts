/**
 * Exposes the physical layout of the host keyboard (AZERTY, QWERTZ…) via
 * the `navigator.keyboard.getLayoutMap()` API (Chromium — same browsers
 * as WebSerial). Used to DISPLAY the correct glyph during live-record:
 * the recorded HID value stays positional (correct), only the label
 * follows the user's layout.
 *
 * Outside Chromium / not supported → `.label()` falls back to the provided fallback.
 */
export class KeyboardLayout {
  map = $state<Map<string, string> | null>(null);

  constructor() {
    this.#load();
    // The layout can change (e.g. OS switch) → re-read.
    if (typeof navigator !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).keyboard?.addEventListener?.('layoutchange', () => this.#load());
    }
  }

  async #load(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kb = (navigator as any).keyboard;
      if (kb?.getLayoutMap) this.map = await kb.getLayoutMap();
    } catch {
      /* not supported → fallback */
    }
  }

  /** Glyph (uppercase) for a `KeyboardEvent.code`, otherwise `fallback`. */
  label(code: string, fallback = ''): string {
    const g = this.map?.get(code);
    return g ? g.toUpperCase() : fallback;
  }
}
