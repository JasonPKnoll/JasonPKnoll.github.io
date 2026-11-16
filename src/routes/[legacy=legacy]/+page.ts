import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { legacyRedirects } from '#lib/legacy.ts';
import type { EntryGenerator, PageLoad } from './$types';

// Old Jekyll URLs (/koi-fish-pond, /discord-bot, ...) redirect to /projects/<slug>.
export const entries: EntryGenerator = () =>
	Object.keys(legacyRedirects).map((legacy) => ({ legacy }));

export const load: PageLoad = ({ params }) => {
	redirect(308, resolve('/projects/[slug]', { slug: legacyRedirects[params.legacy] }));
};
