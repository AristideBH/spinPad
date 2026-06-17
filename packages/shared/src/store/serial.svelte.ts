// ═══════════════════════════════════════════════════════════════
//  store/serial.svelte.ts — WebSerial interface with the keyboard
//
//  Protocol: JSON on a single line terminated by \n
//    → {"cmd":"get_config"}              receives the full config
//    → {"cmd":"set_config","payload":{}} sends a new config
//    → {"cmd":"factory_reset"}           factory reset
// ═══════════════════════════════════════════════════════════════

import { toast } from 'svelte-sonner';
import type { FullConfig } from '$shared/constants/config-schema.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';
import type { RpcQueueEntry, MessageHandler } from '$shared/types/serial.js';
import { devMode } from './devMode.svelte';

// WebSerial API is not in the standard TypeScript libs — local types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SerialPort = any;

// ─────────────────────────────────────────────────────────────
//  REACTIVE STATE (Svelte 5 runes)
// ─────────────────────────────────────────────────────────────

class SerialState {
  connected = $state(false);
  error = $state<string | null>(null);
  reconnecting = $state(false);
  reconnectAttempt = $state(0);
}
export const serial = new SerialState();

// ─────────────────────────────────────────────────────────────
//  INTERNAL STATE
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let port: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let writer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reader: any = null;
let readBuffer = '';

let _reconnectTimer: ReturnType<typeof setInterval> | null = null;
const RECONNECT_INTERVAL_MS = 2000;
const RECONNECT_MAX_ATTEMPTS = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _startReconnect(savedPort: any): void {
  serial.reconnecting = true;
  serial.reconnectAttempt = 0;

  _reconnectTimer = setInterval(async () => {
    serial.reconnectAttempt++;
    if (serial.reconnectAttempt > RECONNECT_MAX_ATTEMPTS) {
      _stopReconnect();
      return;
    }
    try {
      await savedPort.open({ baudRate: 115200 });
      _stopReconnect();
      port = savedPort;
      writer = port.writable!.getWriter();
      port.addEventListener('disconnect', _handleUnexpectedDisconnect);
      startReading();
      serial.connected = true;
      serial.error = null;
      toast.success('Reconnected');
    } catch {
      // Device not available yet
    }
  }, RECONNECT_INTERVAL_MS);
}

function _stopReconnect(): void {
  if (_reconnectTimer) {
    clearInterval(_reconnectTimer);
    _reconnectTimer = null;
  }
  serial.reconnecting = false;
  serial.reconnectAttempt = 0;
}

const encoder = new TextEncoder();
const messageHandlers = new Set<MessageHandler>();

// ─────────────────────────────────────────────────────────────
//  RPC QUEUE
// ─────────────────────────────────────────────────────────────

let _rpcBusy = false;
const _rpcQueue: RpcQueueEntry[] = [];

function _drainRpcQueue(): void {
  if (_rpcBusy || _rpcQueue.length === 0) return;
  _rpcBusy = true;
  const { fn, resolve, reject } = _rpcQueue.shift()!;
  Promise.resolve()
    .then(() => fn())
    .then(resolve, reject)
    .finally(() => {
      _rpcBusy = false;
      _drainRpcQueue();
    });
}

function _enqueueRpc<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    _rpcQueue.push({
      fn: fn as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
    });
    _drainRpcQueue();
  });
}

function _cancelQueuedRpcs(reason: string): void {
  const err = new Error(reason);
  _rpcQueue.splice(0).forEach(({ reject }) => reject(err));
  _rpcBusy = false;
}

// ─────────────────────────────────────────────────────────────
//  CONNECTION
// ─────────────────────────────────────────────────────────────

export async function connect(): Promise<boolean> {
  _stopReconnect();

  if (!('serial' in navigator)) {
    serial.error = 'WebSerial not supported. Use Chrome or Edge.';
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    port = await (navigator as any).serial.requestPort({ filters: [{ usbVendorId: 0x303a }] });
    await port.open({ baudRate: 115200 });

    port.addEventListener('disconnect', _handleUnexpectedDisconnect);

    writer = port.writable!.getWriter();
    startReading();

    serial.connected = true;
    serial.error = null;
    toast.success('Keyboard connected');
    return true;
  } catch (err) {
    const e = err as Error;
    if (e.name !== 'NotFoundError') {
      serial.error = `Connection error: ${e.message}`;
      toast.error('Connection failed', { description: e.message });
    }
    return false;
  }
}

function _handleUnexpectedDisconnect(): void {
  const savedPort = port;
  readBuffer = '';
  _cancelQueuedRpcs('Disconnected');
  writer = null;
  reader = null;
  port = null;
  serial.connected = false;
  toast.warning('Keyboard disconnected — reconnection attempt…');
  if (savedPort) _startReconnect(savedPort);
}

export async function disconnect(): Promise<void> {
  _stopReconnect();
  _cancelQueuedRpcs('Disconnected');
  readBuffer = '';

  try {
    if (writer) await writer.close();
  } catch {
    /* port already closed */
  }
  writer = null;

  try {
    if (reader) reader.cancel();
  } catch {
    /* reader already cancelled */
  }
  reader = null;

  try {
    if (port) await port.close();
  } catch {
    /* port already closed */
  }
  port = null;

  serial.connected = false;
  devMode.active = false;
}

// ─────────────────────────────────────────────────────────────
//  READING
// ─────────────────────────────────────────────────────────────

async function startReading(): Promise<void> {
  reader = port!.readable!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      readBuffer += decoder.decode(value);
      const lines = readBuffer.split('\n');
      readBuffer = lines.pop()!;

      for (const line of lines) {
        if (line.trim()) handleIncomingMessage(line.trim());
      }
    }
  } catch (err) {
    const e = err as Error;
    if (e.name !== 'AbortError') {
      console.error('Serial read error:', e);
      serial.connected = false;
    }
  } finally {
    reader.releaseLock();
  }
}

function handleIncomingMessage(line: string): void {
  try {
    const msg = JSON.parse(line) as unknown;
    messageHandlers.forEach((handler) => handler(msg));
  } catch {
    console.warn('Non-JSON message received:', line);
  }
}

export function onMessage(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

// ─────────────────────────────────────────────────────────────
//  WRITING
// ─────────────────────────────────────────────────────────────

async function sendRaw(jsonString: string): Promise<void> {
  if (!writer || !serial.connected) throw new Error('Not connected');
  await writer.write(encoder.encode(jsonString + '\n'));
}

// ─────────────────────────────────────────────────────────────
//  HELPER RPC
// ─────────────────────────────────────────────────────────────

function _rpcCall<T>(
  command: Record<string, unknown>,
  matchFn: (msg: unknown) => boolean,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let cleanup: (() => void) | undefined;

    const timer = setTimeout(() => {
      cleanup?.();
      reject(new Error(`Timeout — no response from keyboard (${command['cmd']})`));
    }, timeoutMs);

    cleanup = onMessage((msg) => {
      if (matchFn(msg)) {
        clearTimeout(timer);
        cleanup!();
        resolve(msg as T);
      }
    });

    sendRaw(JSON.stringify(command)).catch((err) => {
      clearTimeout(timer);
      cleanup?.();
      reject(err);
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────

export function getConfig(): Promise<FullConfig> {
  if (!serial.connected) return Promise.reject(new Error('Not connected'));
  return _enqueueRpc(() =>
    _rpcCall<FullConfig>({ cmd: 'get_config' }, (msg) => {
      const m = msg as Record<string, unknown>;
      return m['version'] !== undefined && m['profiles'] !== undefined;
    }),
  );
}

export function setConfig(config: FullConfig): Promise<{ status: string }> {
  if (!serial.connected) return Promise.reject(new Error('Not connected'));
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>({ cmd: 'set_config', payload: config }, (msg) => {
      const m = msg as Record<string, unknown>;
      return m['status'] === 'ok' && !m['msg'];
    }),
  );
}

export function factoryReset(): Promise<{ status: string; msg: string }> {
  if (!serial.connected) return Promise.reject(new Error('Not connected'));
  return _enqueueRpc(() =>
    _rpcCall<{ status: string; msg: string }>(
      { cmd: 'factory_reset' },
      (msg) => {
        const m = msg as Record<string, unknown>;
        return m['status'] === 'ok' && m['msg'] === 'factory_reset';
      },
      10000,
    ),
  );
}

export function getDeviceStatus(): Promise<DeviceStatus> {
  if (!serial.connected) return Promise.reject(new Error('Not connected'));
  return _enqueueRpc(() =>
    _rpcCall<DeviceStatus>(
      { cmd: 'device_status' },
      (msg) => {
        const m = msg as Record<string, unknown>;
        return m != null && m['fw'] !== undefined && m['connection'] !== undefined;
      },
      2000,
    ),
  );
}

/**
 * Lightweight switch of the active profile on the firmware side:
 * {"cmd":"set_active_profile", "idx":N}. The device clamps the index, persists
 * to NVS, reloads its keymap and emits a "profile" event on the monitor stream.
 * Avoids resending the entire config just to change profile.
 */
export function setActiveProfile(idx: number): Promise<{ status: string }> {
  if (!serial.connected) return Promise.reject(new Error('Not connected'));
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>(
      { cmd: 'set_active_profile', idx },
      (msg) => (msg as Record<string, unknown>)['status'] === 'ok',
      3000,
    ),
  );
}

export function keyMonitor(enable: boolean): Promise<{ status: string }> {
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>(
      { cmd: 'key_monitor', enable },
      (msg) => (msg as Record<string, unknown>)['status'] === 'ok',
      3000,
    ),
  );
}

/**
 * Enables/disables training mode on the firmware side: while it is ON,
 * the actions assigned to the keys/encoder do NOT execute (the device
 * keeps streaming the monitor events for the studio).
 */
export function trainingModeCmd(enable: boolean): Promise<{ status: string }> {
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>(
      { cmd: 'training_mode', enable },
      (msg) => (msg as Record<string, unknown>)['status'] === 'ok',
      3000,
    ),
  );
}

/** Subscribes to raw key events (without going through the RPC queue). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onKeyEvent(handler: (msg: any) => void): () => void {
  return onMessage((msg) => {
    const m = msg as Record<string, unknown>;
    if (m && m['event'] === 'key') handler(m);
  });
}

/**
 * Subscribes to profile-switch events emitted by the device on the monitor
 * stream: {"event":"profile","active":N,"ts_ms":...}. Allows low-latency sync
 * when the profile changes on-device (slice 5) or via the studio, in addition
 * to the device_status polling (5 s).
 */
export function onProfileEvent(handler: (active: number) => void): () => void {
  return onMessage((msg) => {
    const m = msg as Record<string, unknown>;
    if (m && m['event'] === 'profile' && typeof m['active'] === 'number') {
      handler(m['active'] as number);
    }
  });
}

export function setTime(unixTs: number): Promise<{ status: string }> {
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>(
      { cmd: 'set_time', ts: unixTs },
      (msg) => (msg as Record<string, unknown>)['status'] === 'ok',
      2000,
    ),
  );
}
