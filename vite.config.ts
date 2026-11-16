import adapter from '@sveltejs/adapter-static';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		enhancedImages(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully prerendered static site for GitHub Pages.
			// `404.html` is what GitHub Pages serves for unknown paths.
			adapter: adapter({ fallback: '404.html' }),

			prerender: {
				// Make sure the custom 404 page is generated too.
				entries: ['*']
			}
		})
	]
});
