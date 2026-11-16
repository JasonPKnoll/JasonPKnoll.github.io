/**
 * Old Jekyll URLs → new project slugs. Kept free of image imports because
 * `src/params.ts` is loaded directly by Node at build time.
 */
export const legacyRedirects: Record<string, string> = {
	'koi-fish-pond': 'koi-pond',
	'discord-bot': 'fido-bot',
	'help-network': 'help-network',
	'virtual-watch-party': 'virtual-watch-party',
	weatheraza: 'weatheraza'
};
