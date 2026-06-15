// ═══════════════════════════════════════════════════════════════
//  strip-uncompressed.mjs — post-build embarqué
//
//  adapter-static (precompress: true) génère un `.gz` ET un `.br` à côté
//  de chaque fichier compressible (html/js/css/json/svg). Le firmware ne
//  sert QUE les `.gz` (Content-Encoding: gzip), donc on supprime ici :
//    - les originaux non compressés (jumeau d'un `.gz`)
//    - tous les `.br` (jamais servis)
//  pour ne flasher en SPIFFS que la version gzip.
//
//  On ne touche pas aux fichiers déjà compressés (woff2/png/ico) : ils
//  n'ont pas de jumeau `.gz` et sont conservés tels quels.
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
			// Brotli jamais servi par le firmware → suppression
			const info = await stat(full);
			await unlink(full);
			removed += 1;
			savedBytes += info.size;
		} else if (entry.name.endsWith('.gz')) {
			const original = full.slice(0, -3); // retire ".gz"
			try {
				const info = await stat(original);
				await unlink(original);
				removed += 1;
				savedBytes += info.size;
			} catch {
				// pas d'original (ex: .gz isolé) → rien à faire
			}
		}
	}
}

await walk(dir);

console.log(
	`strip-uncompressed: ${removed} originaux supprimés ` +
		`(${(savedBytes / 1024).toFixed(0)} KB), seuls les .gz restent dans ${dir}/`
);
