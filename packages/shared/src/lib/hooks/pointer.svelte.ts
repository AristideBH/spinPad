import { MediaQuery } from 'svelte/reactivity';

/**
 * `true` when a fine pointer (mouse/trackpad) is available — a reasonable
 * proxy for "a real physical keyboard is probably present".
 * Used to enable/disable live-record in the picker.
 *
 * On a touch-only device (phone, embedded studio via AP),
 * `(any-pointer: fine)` does not match → `.current === false`.
 */
export class HasFinePointer extends MediaQuery {
  constructor() {
    super('(any-pointer: fine)');
  }
}
