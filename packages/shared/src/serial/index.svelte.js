// ═══════════════════════════════════════════════════════════════
//  serial/index.svelte.js — Interface WebSerial avec le clavier
//
//  Protocole : JSON sur une ligne terminée par \n
//    → {"cmd":"get_config"}              reçoit la config complète
//    → {"cmd":"set_config","payload":{}} envoie une nouvelle config
//    → {"cmd":"factory_reset"}           reset usine
// ═══════════════════════════════════════════════════════════════

import { toast } from 'svelte-sonner';

// ─────────────────────────────────────────────────────────────
//  ÉTAT RÉACTIF (Svelte 5 runes)
// ─────────────────────────────────────────────────────────────

class SerialState {
    connected        = $state(false);
    error            = $state(null);
    reconnecting     = $state(false);
    reconnectAttempt = $state(0);
}
export const serial = new SerialState();

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

let port       = null;
let writer     = null;
let reader     = null;
let readBuffer = '';

let _reconnectTimer   = null;
const RECONNECT_INTERVAL_MS   = 2000;
const RECONNECT_MAX_ATTEMPTS  = 15;   // 15 × 2s = 30s

function _startReconnect(savedPort) {
    serial.reconnecting     = true;
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
            port   = savedPort;
            writer = port.writable.getWriter();
            port.addEventListener('disconnect', _handleUnexpectedDisconnect);
            startReading();
            serial.connected = true;
            serial.error     = null;
            toast.success('Reconnecté');
        } catch {
            // Périphérique pas encore disponible
        }
    }, RECONNECT_INTERVAL_MS);
}

function _stopReconnect() {
    if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
    serial.reconnecting     = false;
    serial.reconnectAttempt = 0;
}

const encoder        = new TextEncoder();
const messageHandlers = new Set();

// ─────────────────────────────────────────────────────────────
//  FILE D'ATTENTE RPC
//  Un seul appel en vol à la fois → pas de contamination croisée
//  entre getConfig / setConfig / factoryReset.
// ─────────────────────────────────────────────────────────────

let _rpcBusy = false;
const _rpcQueue = [];

function _drainRpcQueue() {
    if (_rpcBusy || _rpcQueue.length === 0) return;
    _rpcBusy = true;
    const { fn, resolve, reject } = _rpcQueue.shift();
    Promise.resolve()
        .then(() => fn())
        .then(resolve, reject)
        .finally(() => {
            _rpcBusy = false;
            _drainRpcQueue();
        });
}

function _enqueueRpc(fn) {
    return new Promise((resolve, reject) => {
        _rpcQueue.push({ fn, resolve, reject });
        _drainRpcQueue();
    });
}

function _cancelQueuedRpcs(reason) {
    const err = new Error(reason);
    _rpcQueue.splice(0).forEach(({ reject }) => reject(err));
    _rpcBusy = false;
}

// ─────────────────────────────────────────────────────────────
//  CONNEXION
// ─────────────────────────────────────────────────────────────

export async function connect() {
    _stopReconnect();

    if (!('serial' in navigator)) {
        serial.error = 'WebSerial non supporté. Utilise Chrome ou Edge.';
        return false;
    }

    try {
        port = await navigator.serial.requestPort({
            filters: [{ usbVendorId: 0x303A }],  // Espressif — filtre le sélecteur de port
        });
        await port.open({ baudRate: 115200 });

        // Nettoyer proprement si le câble est débranché physiquement
        port.addEventListener('disconnect', _handleUnexpectedDisconnect);

        writer = port.writable.getWriter();
        startReading();

        serial.connected = true;
        serial.error     = null;
        toast.success('Clavier connecté');
        return true;
    } catch (err) {
        if (err.name !== 'NotFoundError') {
            // NotFoundError = user cancelled the port picker, no toast needed
            serial.error = `Erreur connexion : ${err.message}`;
            toast.error('Connexion échouée', { description: err.message });
        }
        return false;
    }
}

function _handleUnexpectedDisconnect() {
    const savedPort = port;
    readBuffer = '';
    _cancelQueuedRpcs('Déconnecté');
    writer = null;
    reader = null;
    port   = null;
    serial.connected = false;
    toast.warning('Clavier déconnecté — tentative de reconnexion…');
    if (savedPort) _startReconnect(savedPort);
}

export async function disconnect() {
    _stopReconnect();
    _cancelQueuedRpcs('Déconnecté');
    readBuffer = '';

    try { if (writer) await writer.close(); } catch { /* port déjà fermé */ }
    writer = null;

    try { if (reader) reader.cancel(); } catch { /* reader déjà annulé */ }
    reader = null;

    try { if (port) await port.close(); } catch { /* port déjà fermé */ }
    port = null;

    serial.connected = false;
}

// ─────────────────────────────────────────────────────────────
//  LECTURE
// ─────────────────────────────────────────────────────────────

async function startReading() {
    reader = port.readable.getReader();
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            readBuffer += decoder.decode(value);
            const lines = readBuffer.split('\n');
            readBuffer = lines.pop();

            for (const line of lines) {
                if (line.trim()) handleIncomingMessage(line.trim());
            }
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Erreur lecture serial:', err);
            serial.connected = false;
        }
    } finally {
        reader.releaseLock();
    }
}

function handleIncomingMessage(line) {
    try {
        const msg = JSON.parse(line);
        messageHandlers.forEach(handler => handler(msg));
    } catch {
        console.warn('Message non-JSON reçu:', line);
    }
}

export function onMessage(handler) {
    messageHandlers.add(handler);
    return () => messageHandlers.delete(handler);
}

// ─────────────────────────────────────────────────────────────
//  ÉCRITURE
// ─────────────────────────────────────────────────────────────

async function sendRaw(jsonString) {
    if (!writer || !serial.connected) throw new Error('Non connecté');
    await writer.write(encoder.encode(jsonString + '\n'));
}

// ─────────────────────────────────────────────────────────────
//  HELPER RPC
//  Envoie une commande, attend la première réponse qui satisfait
//  matchFn, et rejette proprement en cas de timeout ou d'erreur d'écriture.
// ─────────────────────────────────────────────────────────────

function _rpcCall(command, matchFn, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        let cleanup;

        const timer = setTimeout(() => {
            cleanup?.();
            reject(new Error(`Timeout — pas de réponse du clavier (${command.cmd})`));
        }, timeoutMs);

        cleanup = onMessage((msg) => {
            if (matchFn(msg)) {
                clearTimeout(timer);
                cleanup();
                resolve(msg);
            }
        });

        sendRaw(JSON.stringify(command)).catch(err => {
            clearTimeout(timer);
            cleanup?.();
            reject(err);
        });
    });
}

// ─────────────────────────────────────────────────────────────
//  API PUBLIQUE
// ─────────────────────────────────────────────────────────────

export function getConfig() {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'get_config' },
        msg => msg.version !== undefined && msg.profiles !== undefined
    ));
}

export function setConfig(config) {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'set_config', payload: config },
        msg => msg.status === 'ok' && !msg.msg  // exclut factory_reset
    ));
}

export function factoryReset() {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'factory_reset' },
        msg => msg.status === 'ok' && msg.msg === 'factory_reset',
        10000  // reset usine peut prendre plus de temps
    ));
}

export function getDeviceStatus() {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'device_status' },
        msg => msg && msg.fw !== undefined && msg.connection !== undefined,
        2000
    ));
}

export function keyMonitor(enable) {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'key_monitor', enable },
        msg => msg.status === 'ok',
        3000
    ));
}

// Subscribe to raw key events (event === 'key') without going through the RPC queue.
// Returns an unsubscribe function.
export function onKeyEvent(handler) {
    return onMessage(msg => {
        if (msg && msg.event === 'key') handler(msg);
    });
}

export function setTime(unixTs) {
    return _enqueueRpc(() => _rpcCall(
        { cmd: 'set_time', ts: unixTs },
        msg => msg.status === 'ok',
        2000
    ));
}
