import { getDocsManifest } from '$lib/docs/index.js';

export function load() {
    return { manifest: getDocsManifest() };
}
