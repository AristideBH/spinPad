/**
 * État partagé du tiroir « Macros globales » (MacroManager).
 *
 * Permet d'ouvrir le gestionnaire de macros sur un slot précis depuis n'importe
 * où (ex : action d'un toast après création d'une macro en live-record).
 */
class MacroManagerStore {
  /** Le tiroir est-il ouvert ? Lié via `bind:open` dans MacroManager.svelte. */
  open = $state(false);

  /** Slot à charger à la prochaine ouverture (null = garder la sélection courante). */
  requestedIndex = $state<number | null>(null);

  /** Ouvre le tiroir et demande le chargement du slot `idx`. */
  openAt(idx: number): void {
    this.requestedIndex = idx;
    this.open = true;
  }
}

export const macroManager = new MacroManagerStore();
