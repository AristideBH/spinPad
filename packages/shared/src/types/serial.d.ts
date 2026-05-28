// ═══════════════════════════════════════════════════════════════
//  types/serial.ts — Types internes du transport WebSerial
// ═══════════════════════════════════════════════════════════════

/** Entrée dans la file RPC. */
export interface RpcQueueEntry {
  fn:      () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject:  (e: unknown) => void;
}

/** Handler abonné aux messages entrants. */
export type MessageHandler = (msg: unknown) => void;

/** Snapshot de l'état série (utile pour les composants). */
export interface SerialStateSnapshot {
  connected:        boolean;
  error:            string | null;
  reconnecting:     boolean;
  reconnectAttempt: number;
}
