/**
 * Resume content. This is the single source for the /resume page and the
 * downloadable versions (PDF and plain text), so edit it here only.
 *
 * Typos from the original Word file are fixed (Collaborative, Nevada,
 * PostgreSQL, GitHub). The phone number is left off on purpose since this is
 * a public site; add a `phone` field if you want it shown.
 */
export type Role = {
	title: string;
	period: string;
	summary: string;
	highlights: string[];
};

export type Job = {
	company: string;
	location: string;
	period: string;
	roles: Role[];
};

export const resume = {
	name: 'Jason Knoll',
	headline: 'Software Engineer',
	location: 'Denver, CO',
	email: 'Jason@Knoll.co',
	links: [
		{ name: 'LinkedIn', label: 'linkedin.com/in/jason-p-knoll', href: 'https://www.linkedin.com/in/jason-p-knoll/' },
		{ name: 'GitHub', label: 'github.com/JasonPKnoll', href: 'https://github.com/JasonPKnoll' },
		{ name: 'Website', label: 'jpknoll.com', href: 'https://www.jpknoll.com' }
	],
	traits: ['Results-driven', 'Collaborative', 'Adaptable'],
	summary:
		'With over 10 years of experience in finance and 3 of those years specializing in fintech, I bring a unique blend of industry expertise and technical proficiency. I have developed and deployed multiple fintech-focused web applications using NestJS, TypeScript, React, PostgreSQL, REST, and GraphQL.',
	skills: [
		'Node.js',
		'NestJS',
		'TypeScript',
		'Prisma ORM',
		'PostgreSQL',
		'Ruby',
		'Rails',
		'Python',
		'REST',
		'GraphQL',
		'React',
		'Git',
		'GitHub',
		'TDD',
		'CI/CD'
	],
	experience: [
		{
			company: 'Forge Global',
			location: 'Denver, CO',
			period: 'May 2022 - April 2025',
			roles: [
				{
					title: 'Software Engineer II',
					period: '2023 - 2025',
					summary:
						'Expanded my contributions beyond the Data Feeds API (DAPI) to work across both the frontend and backend of the Forge Data Management System (FDMS), an internal CRM platform used to manage critical data.',
					highlights: [
						'Sped up the CI/CD pipeline by 79%, cutting build time from 49 minutes to 10 minutes and shortening deployment cycles',
						'Developed frontend features using React, TypeScript, Vite, and Tailwind CSS to deliver a clean, intuitive UI for internal teams to manage key operational data',
						'Performed server-side development for two RESTful APIs (FDMS backend and DAPI), improving data management and integration',
						'Used Swagger CodeGen to generate typed client libraries for third-party web APIs, improving API documentation, keeping frontend-backend communication type-safe, and supporting DAPI proxy services for FDMS endpoints',
						'Set up the first Splunk and Datadog dashboards to improve observability, real-time monitoring, and operational insight'
					]
				},
				{
					title: 'Software Engineer I',
					period: '2022 - 2023',
					summary:
						'Focused on building and enhancing the Data Feeds API, which delivered high-quality data to internal teams and external clients, using Node.js, NestJS, TypeScript, Prisma, PostgreSQL, REST, and GraphQL.',
					highlights: [
						'Performed server-side development for DAPI, supporting internal systems and external client data delivery',
						'Developed GraphQL queries for efficient, flexible data access',
						'Implemented Sentry to improve observability, streamline issue tracking, and increase reliability'
					]
				}
			]
		},
		{
			company: 'JPMorgan Chase',
			location: 'Phoenix, AZ',
			period: 'May 2015 - January 2021',
			roles: [
				{
					title: 'Business Development Specialist',
					period: '',
					summary:
						'Supported commercial clients by implementing tailored financial solutions with teams across 80 branches in Arizona, Nevada, and Utah. This role built my expertise in financial products, client relationship management, and strategic communication, skills that still inform my work in fintech today.',
					highlights: []
				}
			]
		}
	] satisfies Job[],
	education: [
		{ credential: 'Certificate in Back-End Software Engineering', school: 'Turing School of Software Design', year: '2021' },
		{ credential: 'A.A.S. General Business', school: 'Scottsdale Community College', year: '' }
	]
};

/** File names for the downloads (served from /resume.pdf and /resume.md). */
export const resumeFiles = {
	pdf: 'Jason_Knoll_Resume.pdf',
	md: 'Jason_Knoll_Resume.md'
};

/**
 * Plain Markdown version. Every role repeats its company, location and dates
 * so each section still makes sense on its own when a parser or AI reviewer
 * splits the file up.
 */
export function resumeMarkdown(): string {
	const r = resume;
	const out: string[] = [
		`# ${r.name}`,
		'',
		`**${r.headline}** | ${r.location}`,
		'',
		`- Email: ${r.email}`,
		...r.links.map((l) => `- ${l.name}: ${l.href}`),
		'',
		'## Summary',
		'',
		r.summary,
		'',
		`Strengths: ${r.traits.join(', ')}`,
		'',
		'## Skills',
		'',
		r.skills.join(', '),
		'',
		'## Experience',
		''
	];
	for (const job of r.experience) {
		for (const role of job.roles) {
			out.push(`### ${role.title}, ${job.company}`, '');
			out.push(`${job.location} | ${role.period || job.period}`, '');
			out.push(role.summary, '');
			for (const h of role.highlights) out.push(`- ${h}`);
			if (role.highlights.length) out.push('');
		}
	}
	out.push('## Education', '');
	for (const e of r.education) {
		out.push(`- ${e.credential}, ${e.school}${e.year ? ` (${e.year})` : ''}`);
	}
	out.push('');
	return out.join('\n');
}
