import { defineParams } from '@sveltejs/kit/params';
import { legacyRedirects } from './lib/legacy.ts';

export const params = defineParams({
	/** Matches the old Jekyll project URLs, e.g. `/koi-fish-pond`. */
	legacy: (param) => (param in legacyRedirects ? param : undefined)
});
