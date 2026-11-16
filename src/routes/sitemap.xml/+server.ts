import { projects } from '#lib/projects.ts';
import { site } from '#lib/site.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

// Only canonical pages: the legacy redirect URLs and error page are left out on purpose.
const paths = ['/', '/projects', ...projects.map((p) => `/projects/${p.slug}`)];

export const GET: RequestHandler = () => {
	const urls = paths.map((path) => `\t<url><loc>${site.url}${path}</loc></url>`).join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
