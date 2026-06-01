/**
 * Expose la disposition physique du clavier hôte (AZERTY, QWERTZ…) via
 * l'API `navigator.keyboard.getLayoutMap()` (Chromium — mêmes navigateurs
 * que WebSerial). Sert à AFFICHER le bon glyphe lors du live-record :
 * la valeur HID enregistrée reste positionnelle (correcte), seul le label
 * suit la disposition de l'utilisateur.
 *
 * Hors Chromium / non supporté → `.label()` retombe sur le fallback fourni.
 */
export class KeyboardLayout {
  map = $state<Map<string, string> | null>(null);

  constructor() {
    this.#load();
    // La disposition peut changer (ex. bascule OS) → re-lire.
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
      /* non supporté → fallback */
    }
  }

  /** Glyphe (majuscule) pour un `KeyboardEvent.code`, sinon `fallback`. */
  label(code: string, fallback = ''): string {
    const g = this.map?.get(code);
    return g ? g.toUpperCase() : fallback;
  }
}
