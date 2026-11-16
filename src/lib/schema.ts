/** schema.org structured data (JSON-LD) for search engines. */
import portraitUrl from '#lib/assets/Portrait.jpg?w=800&format=jpg&as=url';
import type { Project } from '#lib/projects.ts';
import { site } from '#lib/site.ts';

const abs = (path: string) => new URL(path, site.url).href;

const personId = `${site.url}/#person`;
const websiteId = `${site.url}/#website`;

export const person = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	'@id': personId,
	name: site.name,
	url: `${site.url}/`,
	image: abs(portraitUrl),
	jobTitle: site.role,
	description: site.intro,
	knowsAbout: Object.values(site.stack).flat(),
	alumniOf: { '@type': 'EducationalOrganization', name: 'Turing School of Software & Design' },
	sameAs: site.socials.map((s) => s.href)
};

export const website = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	'@id': websiteId,
	name: site.name,
	url: `${site.url}/`,
	description: site.description,
	inLanguage: 'en',
	author: { '@id': personId }
};

type Crumb = { name: string; path: string };

export const breadcrumbs = (crumbs: Crumb[]) => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: crumbs.map((c, i) => ({
		'@type': 'ListItem',
		position: i + 1,
		name: c.name,
		item: abs(c.path)
	}))
});

export const projectPage = (project: Project, path: string) => {
	const repo = project.links.find((l) => l.href.includes('github.com'))?.href;
	return {
		'@context': 'https://schema.org',
		'@type': repo ? 'SoftwareSourceCode' : 'CreativeWork',
		name: project.name,
		headline: project.name,
		description: project.description,
		url: abs(path),
		image: abs(project.cover.img.src),
		keywords: project.tech.join(', '),
		inLanguage: 'en',
		author: { '@id': personId },
		isPartOf: { '@id': websiteId },
		...(repo && { codeRepository: repo, programmingLanguage: project.tech }),
		...(project.status && { creativeWorkStatus: project.status })
	};
};
