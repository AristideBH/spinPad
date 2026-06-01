import { MediaQuery } from 'svelte/reactivity';

/**
 * `true` quand un pointeur fin (souris/trackpad) est disponible — proxy
 * raisonnable pour « un vrai clavier physique est probablement présent ».
 * Sert à activer/désactiver le live-record dans le picker.
 *
 * Sur un appareil tactile uniquement (téléphone, studio embarqué via AP),
 * `(any-pointer: fine)` ne matche pas → `.current === false`.
 */
export class HasFinePointer extends MediaQuery {
  constructor() {
    super('(any-pointer: fine)');
  }
}
