import { getDocBySlug } from '$lib/docs/index.js';
import { error }        from '@sveltejs/kit';

export function load({ params }) {
    const doc = getDocBySlug(params.slug);
    if (!doc) throw error(404, 'Page introuvable');
    return { doc };
}
