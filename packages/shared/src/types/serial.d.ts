// ═══════════════════════════════════════════════════════════════
//  types/serial.ts — Internal types of the WebSerial transport
// ═══════════════════════════════════════════════════════════════

/** Entry in the RPC queue. */
export interface RpcQueueEntry {
  fn:      () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject:  (e: unknown) => void;
}

/** Handler subscribed to incoming messages. */
export type MessageHandler = (msg: unknown) => void;

/** Snapshot of the serial state (useful for components). */
export interface SerialStateSnapshot {
  connected:        boolean;
  error:            string | null;
  reconnecting:     boolean;
  reconnectAttempt: number;
}
