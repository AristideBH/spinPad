// ═══════════════════════════════════════════════════════════════
//  strip-uncompressed.mjs — embedded post-build
//
//  adapter-static (precompress: true) generates a `.gz` AND a `.br` next to
//  each compressible file (html/js/css/json/svg). The firmware serves ONLY
//  the `.gz` (Content-Encoding: gzip), so here we remove:
//    - the uncompressed originals (twin of a `.gz`)
//    - all the `.br` (never served)
//  to flash only the gzip version into SPIFFS.
//
//  We do not touch the already-compressed files (woff2/png/ico): they
//  have no `.gz` twin and are kept as-is.
// ═══════════════════════════════════════════════════════════════

import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2] || 'build-embedded';

let removed = 0;
let savedBytes = 0;

async function walk(current) {
	const entries = await readdir(current, { withFileTypes: true });
	for (const entry of entries) {
		const full = join(current, entry.name);
		if (entry.isDirectory()) {
			await walk(full);
		} else if (entry.name.endsWith('.br')) {
			// Brotli never served by the firmware → removed
			const info = await stat(full);
			await unlink(full);
			removed += 1;
			savedBytes += info.size;
		} else if (entry.name.endsWith('.gz')) {
			const original = full.slice(0, -3); // strips ".gz"
			try {
				const info = await stat(original);
				await unlink(original);
				removed += 1;
				savedBytes += info.size;
			} catch {
				// no original (e.g. standalone .gz) → nothing to do
			}
		}
	}
}

await walk(dir);

console.log(
	`strip-uncompressed: ${removed} originals removed ` +
		`(${(savedBytes / 1024).toFixed(0)} KB), only the .gz remain in ${dir}/`
);
