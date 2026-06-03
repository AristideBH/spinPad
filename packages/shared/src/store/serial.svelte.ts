// ═══════════════════════════════════════════════════════════════
//  store/serial.svelte.ts — Interface WebSerial avec le clavier
//
//  Protocole : JSON sur une ligne terminée par \n
//    → {"cmd":"get_config"}              reçoit la config complète
//    → {"cmd":"set_config","payload":{}} envoie une nouvelle config
//    → {"cmd":"factory_reset"}           reset usine
// ═══════════════════════════════════════════════════════════════

import { toast } from 'svelte-sonner';
import type { FullConfig } from '$shared/constants/config-schema.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';
import type { RpcQueueEntry, MessageHandler } from '$shared/types/serial.js';
import { devMode } from './devMode.svelte';

// WebSerial API n'est pas dans les lib TypeScript standard — types locaux.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SerialPort = any;

// ─────────────────────────────────────────────────────────────
//  ÉTAT RÉACTIF (Svelte 5 runes)
// ─────────────────────────────────────────────────────────────

class SerialState {
  connected = $state(false);
  error = $state<string | null>(null);
  reconnecting = $state(false);
  reconnectAttempt = $state(0);
}
export const serial = new SerialState();

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
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
      toast.success('Reconnecté');
    } catch {
      // Périphérique pas encore disponible
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
//  FILE D'ATTENTE RPC
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
//  CONNEXION
// ─────────────────────────────────────────────────────────────

export async function connect(): Promise<boolean> {
  _stopReconnect();

  if (!('serial' in navigator)) {
    serial.error = 'WebSerial non supporté. Utilise Chrome ou Edge.';
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
    toast.success('Clavier connecté');
    return true;
  } catch (err) {
    const e = err as Error;
    if (e.name !== 'NotFoundError') {
      serial.error = `Erreur connexion : ${e.message}`;
      toast.error('Connexion échouée', { description: e.message });
    }
    return false;
  }
}

function _handleUnexpectedDisconnect(): void {
  const savedPort = port;
  readBuffer = '';
  _cancelQueuedRpcs('Déconnecté');
  writer = null;
  reader = null;
  port = null;
  serial.connected = false;
  toast.warning('Clavier déconnecté — tentative de reconnexion…');
  if (savedPort) _startReconnect(savedPort);
}

export async function disconnect(): Promise<void> {
  _stopReconnect();
  _cancelQueuedRpcs('Déconnecté');
  readBuffer = '';

  try {
    if (writer) await writer.close();
  } catch {
    /* port déjà fermé */
  }
  writer = null;

  try {
    if (reader) reader.cancel();
  } catch {
    /* reader déjà annulé */
  }
  reader = null;

  try {
    if (port) await port.close();
  } catch {
    /* port déjà fermé */
  }
  port = null;

  serial.connected = false;
  devMode.active = false;
}

// ─────────────────────────────────────────────────────────────
//  LECTURE
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
      console.error('Erreur lecture serial:', e);
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
    console.warn('Message non-JSON reçu:', line);
  }
}

export function onMessage(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

// ─────────────────────────────────────────────────────────────
//  ÉCRITURE
// ─────────────────────────────────────────────────────────────

async function sendRaw(jsonString: string): Promise<void> {
  if (!writer || !serial.connected) throw new Error('Non connecté');
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
      reject(new Error(`Timeout — pas de réponse du clavier (${command['cmd']})`));
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
//  API PUBLIQUE
// ─────────────────────────────────────────────────────────────

export function getConfig(): Promise<FullConfig> {
  if (!serial.connected) return Promise.reject(new Error('Non connecté'));
  return _enqueueRpc(() =>
    _rpcCall<FullConfig>({ cmd: 'get_config' }, (msg) => {
      const m = msg as Record<string, unknown>;
      return m['version'] !== undefined && m['profiles'] !== undefined;
    }),
  );
}

export function setConfig(config: FullConfig): Promise<{ status: string }> {
  if (!serial.connected) return Promise.reject(new Error('Non connecté'));
  return _enqueueRpc(() =>
    _rpcCall<{ status: string }>({ cmd: 'set_config', payload: config }, (msg) => {
      const m = msg as Record<string, unknown>;
      return m['status'] === 'ok' && !m['msg'];
    }),
  );
}

export function factoryReset(): Promise<{ status: string; msg: string }> {
  if (!serial.connected) return Promise.reject(new Error('Non connecté'));
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
  if (!serial.connected) return Promise.reject(new Error('Non connecté'));
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
 * Bascule légère du profil actif côté firmware : {"cmd":"set_active_profile",
 * "idx":N}. Le device clamp l'index, persiste en NVS, recharge son keymap et
 * émet un événement "profile" sur le stream moniteur. Évite de renvoyer toute
 * la config juste pour changer de profil.
 */
export function setActiveProfile(idx: number): Promise<{ status: string }> {
  if (!serial.connected) return Promise.reject(new Error('Non connecté'));
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
 * Active/désactive le mode training côté firmware : tant qu'il est ON,
 * les actions assignées aux touches/encoder ne s'exécutent PAS (le device
 * continue à streamer les events du monitor pour le studio).
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

/** S'abonne aux événements de touche bruts (sans passer par la file RPC). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onKeyEvent(handler: (msg: any) => void): () => void {
  return onMessage((msg) => {
    const m = msg as Record<string, unknown>;
    if (m && m['event'] === 'key') handler(m);
  });
}

/**
 * S'abonne aux événements de bascule de profil émis par le device sur le stream
 * moniteur : {"event":"profile","active":N,"ts_ms":...}. Permet une synchro
 * basse latence quand le profil change on-device (slice 5) ou via le studio,
 * en complément du polling device_status (5 s).
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
