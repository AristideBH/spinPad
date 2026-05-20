// ═══════════════════════════════════════════════════════════════
//  serial/index.svelte.js — Interface WebSerial avec le clavier
//
//  Protocole : JSON sur une ligne terminée par \n
//    → {"cmd":"get_config"}              reçoit la config complète
//    → {"cmd":"set_config","payload":{}} envoie une nouvelle config
//    → {"cmd":"factory_reset"}           reset usine
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  ÉTAT RÉACTIF (Svelte 5 runes)
// ─────────────────────────────────────────────────────────────

class SerialState {
    connected = $state(false);
    error = $state(null);
}
export const serial = new SerialState();

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

let port = null;
let writer = null;
let reader = null;
let readBuffer = '';

const messageHandlers = new Set();

// ─────────────────────────────────────────────────────────────
//  CONNEXION
// ─────────────────────────────────────────────────────────────

export async function connect() {
    if (!('serial' in navigator)) {
        serial.error = 'WebSerial non supporté. Utilise Chrome ou Edge.';
        return false;
    }

    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        writer = port.writable.getWriter();
        startReading();

        serial.connected = true;
        serial.error = null;
        return true;
    } catch (err) {
        serial.error = `Erreur connexion : ${err.message}`;
        return false;
    }
}

export async function disconnect() {
    if (writer) { await writer.close(); writer = null; }
    if (reader) { reader.cancel(); reader = null; }
    if (port) { await port.close(); port = null; }
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
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(jsonString + '\n'));
}

// ─────────────────────────────────────────────────────────────
//  API PUBLIQUE
// ─────────────────────────────────────────────────────────────

export async function getConfig() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout — pas de réponse du clavier'));
        }, 5000);

        const cleanup = onMessage((msg) => {
            if (msg.version !== undefined && msg.profiles !== undefined) {
                clearTimeout(timeout);
                cleanup();
                resolve(msg);
            }
        });

        sendRaw(JSON.stringify({ cmd: 'get_config' }));
    });
}

export async function setConfig(config) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout'));
        }, 5000);

        const cleanup = onMessage((msg) => {
            if (msg.status === 'ok') {
                clearTimeout(timeout);
                cleanup();
                resolve(msg);
            }
        });

        sendRaw(JSON.stringify({ cmd: 'set_config', payload: config }));
    });
}

export async function factoryReset() {
    await sendRaw(JSON.stringify({ cmd: 'factory_reset' }));
}
