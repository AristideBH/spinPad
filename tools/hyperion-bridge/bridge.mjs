#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  SpinPad ↔ Hyperion NG bridge
//
//  Connecte à Hyperion NG via JSON-RPC TCP (port 19444) et envoie
//  les couleurs du "segment SpinPad" aux LEDs du macropad via
//  le protocole serial.
//
//  Usage :
//    node bridge.mjs [options]
//
//  Options :
//    --port <path>       Port série du SpinPad (ex: /dev/ttyACM0, COM3)
//    --hyperion <host>   Hôte Hyperion NG (défaut: 127.0.0.1)
//    --hport <port>      Port JSON Hyperion NG (défaut: 19444)
//    --leds <n>          Nombre de LEDs SpinPad à allumer (défaut: 10)
//    --priority <n>      Priorité Hyperion (défaut: 150)
//    --demo              Mode démo (arc-en-ciel sans Hyperion ni SpinPad)
//    --list              Lister les ports série disponibles et quitter
//
//  Protocole serial SpinPad :
//    La commande EXT_FRAME est une ligne JSON :
//    {"cmd":"ext","rgb":[R0,G0,B0,R1,G1,B1,...]}
//    suivie d'un \n.
// ═══════════════════════════════════════════════════════════════

import net     from 'net';
import { SerialPort } from 'serialport';

// ── Parsing des arguments ──────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag, def) {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const OPT = {
    port:     getArg('--port',     null),
    hyperion: getArg('--hyperion', '127.0.0.1'),
    hport:    parseInt(getArg('--hport',    '19444'), 10),
    leds:     parseInt(getArg('--leds',     '10'),    10),
    priority: parseInt(getArg('--priority', '150'),   10),
    demo:     args.includes('--demo'),
    list:     args.includes('--list'),
};

// ── Lister les ports ───────────────────────────────────────────
if (OPT.list) {
    const ports = await SerialPort.list();
    if (ports.length === 0) {
        console.log('Aucun port série détecté.');
    } else {
        console.log('Ports série disponibles :');
        for (const p of ports) {
            console.log(`  ${p.path}  (${p.manufacturer ?? '?'}  ${p.serialNumber ?? ''})`);
        }
    }
    process.exit(0);
}

// ── Mode démo ─────────────────────────────────────────────────
if (OPT.demo) {
    console.log('[DEMO] Mode démo — arc-en-ciel sans connexion réelle');
    let hue = 0;
    setInterval(() => {
        const frame = buildRainbow(OPT.leds, hue);
        console.log(`[DEMO] frame rgb[0..2] = ${frame[0]},${frame[1]},${frame[2]}`);
        hue = (hue + 5) % 360;
    }, 50);
    process.exit(0);
}

// ── Connexion série ────────────────────────────────────────────
if (!OPT.port) {
    console.error('Erreur : spécifiez --port <chemin> (ex: --port /dev/ttyACM0)');
    console.error('Utilisez --list pour voir les ports disponibles.');
    process.exit(1);
}

const serial = new SerialPort({ path: OPT.port, baudRate: 115200 });
serial.on('open', () => console.log(`[SERIAL] Connecté sur ${OPT.port}`));
serial.on('error', err => console.error('[SERIAL] Erreur :', err.message));

function sendFrame(rgbBytes) {
    // rgbBytes : Uint8Array de longueur LED_COUNT * 3
    const arr = Array.from(rgbBytes);
    const cmd = JSON.stringify({ cmd: 'ext', rgb: arr }) + '\n';
    serial.write(cmd);
}

// ── Connexion Hyperion NG ──────────────────────────────────────
let hyperionSocket = null;
let reconnectTimer = null;
let buffer = '';

function connectHyperion() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

    console.log(`[HYPERION] Connexion à ${OPT.hyperion}:${OPT.hport}…`);
    hyperionSocket = net.createConnection({ host: OPT.hyperion, port: OPT.hport });

    hyperionSocket.on('connect', () => {
        console.log('[HYPERION] Connecté.');
        // S'abonner aux updates de LED (JSON-RPC subscription)
        subscribe();
    });

    hyperionSocket.on('data', chunk => {
        buffer += chunk.toString('utf8');
        // Les messages Hyperion sont séparés par des sauts de ligne
        const lines = buffer.split('\n');
        buffer = lines.pop(); // conserver le fragment incomplet
        for (const line of lines) {
            if (line.trim()) handleHyperionMessage(line.trim());
        }
    });

    hyperionSocket.on('close', () => {
        console.warn('[HYPERION] Connexion fermée. Reconnexion dans 5s…');
        reconnectTimer = setTimeout(connectHyperion, 5000);
    });

    hyperionSocket.on('error', err => {
        console.error('[HYPERION] Erreur :', err.message);
        hyperionSocket.destroy();
    });
}

function subscribe() {
    // Hyperion NG JSON-RPC : s'abonner aux "led-colors" updates
    const req = JSON.stringify({
        command: 'subscribe',
        subscribe: ['led-colors-update'],
        tan: 1,
    }) + '\n';
    hyperionSocket.write(req);
}

function handleHyperionMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return; }

    // Réponse à la subscription
    if (msg.command === 'subscribe' && msg.success) {
        console.log('[HYPERION] Abonnement actif. En attente de frames…');
        return;
    }

    // Update led-colors
    if (msg.command === 'led-colors-update' && msg.result?.['led-colors']) {
        const colors = msg.result['led-colors'];
        // colors = [{ index:0, value:{red,green,blue} }, ...]
        const frame = extractSpinpadFrame(colors, OPT.leds);
        sendFrame(frame);
    }
}

/**
 * Extrait les couleurs des N premières LEDs Hyperion sous forme de Uint8Array RGB.
 * Si Hyperion a moins de N LEDs configurées pour le SpinPad, complète avec du noir.
 */
function extractSpinpadFrame(colors, count) {
    const frame = new Uint8Array(count * 3); // noir par défaut
    for (const c of colors) {
        if (c.index >= count) continue;
        const i = c.index * 3;
        frame[i]     = c.value.red   ?? 0;
        frame[i + 1] = c.value.green ?? 0;
        frame[i + 2] = c.value.blue  ?? 0;
    }
    return frame;
}

// ── Helpers démo ───────────────────────────────────────────────
function buildRainbow(count, hueOffset) {
    const frame = new Uint8Array(count * 3);
    for (let i = 0; i < count; i++) {
        const hue = (hueOffset + (360 / count) * i) % 360;
        const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
        frame[i * 3]     = r;
        frame[i * 3 + 1] = g;
        frame[i * 3 + 2] = b;
    }
    return frame;
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}

// ── Démarrage ─────────────────────────────────────────────────
connectHyperion();
