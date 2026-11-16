<script lang="ts">
	import { Download, FileText, Mail, MapPin } from '@lucide/svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { resume, resumeFiles } from '#lib/resume.ts';
	import { breadcrumbs, resumePage } from '#lib/schema.ts';
</script>

<Seo
	title="Resume"
	type="profile"
	description="Resume of Jason Knoll, software engineer in Denver, CO. Full-stack fintech work with Node.js, NestJS, TypeScript, React, PostgreSQL, REST, and GraphQL. Download as PDF or plain text."
	jsonLd={[
		resumePage(resume, '/resume'),
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: 'Resume', path: '/resume' }
		])
	]}
/>

<svelte:head>
	<link rel="alternate" type="text/markdown" href="/resume.md" title="Resume (Markdown)" />
	<link rel="alternate" type="application/pdf" href="/resume.pdf" title="Resume (PDF)" />
</svelte:head>

<section class="container page">
	<header class="intro">
		<p class="eyebrow">Resume</p>
		<h1>{resume.name}</h1>
		<p class="headline"><span class="gradient-text">{resume.headline}</span></p>
		<ul class="traits" aria-label="Strengths">
			{#each resume.traits as trait (trait)}
				<li class="chip">{trait}</li>
			{/each}
		</ul>

		<ul class="contact">
			<li><MapPin size={16} aria-hidden="true" />{resume.location}</li>
			<li>
				<Mail size={16} aria-hidden="true" /><a href="mailto:{resume.email}">{resume.email}</a>
			</li>
		</ul>

		<div class="actions">
			<a class="btn btn-primary" href="/resume.pdf" download={resumeFiles.pdf}>
				<Download size={18} aria-hidden="true" /> Download PDF
			</a>
			<a class="btn" href="/resume.md" download={resumeFiles.md}>
				<FileText size={18} aria-hidden="true" /> Plain text (.md)
			</a>
		</div>
		<p class="note">
			Single-column and text-based, so it reads cleanly for people, applicant tracking systems, and
			AI reviewers.
		</p>
	</header>

	<div class="layout">
		<div class="main">
			<section aria-labelledby="summary">
				<h2 id="summary" class="eyebrow">Summary</h2>
				<p class="summary">{resume.summary}</p>
			</section>

			<section aria-labelledby="experience">
				<h2 id="experience" class="eyebrow">Experience</h2>
				<ol class="jobs">
					{#each resume.experience as job (job.company)}
						<li class="job">
							<div class="job-head">
								<h3>{job.company}</h3>
								<p class="meta mono">{job.location} <span aria-hidden="true">·</span> {job.period}</p>
							</div>
							<ol class="roles">
								{#each job.roles as role (role.title)}
									<li class="role">
										<div class="role-head">
											<h4>{role.title}</h4>
											{#if role.period}<span class="meta mono">{role.period}</span>{/if}
										</div>
										<p>{role.summary}</p>
										{#if role.highlights.length}
											<ul class="highlights">
												{#each role.highlights as h (h)}
													<li>{h}</li>
												{/each}
											</ul>
										{/if}
									</li>
								{/each}
							</ol>
						</li>
					{/each}
				</ol>
			</section>
		</div>

		<aside>
			<section aria-labelledby="skills">
				<h2 id="skills" class="eyebrow">Skills</h2>
				<ul class="skills">
					{#each resume.skills as skill (skill)}
						<li class="chip">{skill}</li>
					{/each}
				</ul>
			</section>

			<section aria-labelledby="education">
				<h2 id="education" class="eyebrow">Education</h2>
				<ul class="education">
					{#each resume.education as e (e.credential)}
						<li>
							<strong>{e.credential}</strong>
							<span>{e.school}{e.year ? `, ${e.year}` : ''}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section aria-labelledby="links">
				<h2 id="links" class="eyebrow">Links</h2>
				<ul class="links">
					{#each resume.links as l (l.href)}
						<li><a href={l.href} rel="me noopener" target="_blank">{l.label}</a></li>
					{/each}
				</ul>
			</section>
		</aside>
	</div>
</section>

<style>
	.page {
		padding-top: calc(var(--nav-h) + clamp(3rem, 8vw, 6rem));
		padding-bottom: clamp(3rem, 8vw, 6rem);
	}
	.intro {
		padding-bottom: 2.5rem;
		border-bottom: 1px solid var(--border);
	}
	h1 {
		font-size: clamp(2.4rem, 5vw, 3.75rem);
		letter-spacing: -0.035em;
		margin: 0.75rem 0 0.35rem;
	}
	.headline {
		font-size: clamp(1.2rem, 2.4vw, 1.5rem);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.traits,
	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.traits {
		margin-top: 1.1rem;
	}
	.contact {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin-top: 1.4rem;
		color: var(--text-muted);
	}
	.contact li {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}
	.contact a:hover,
	.links a:hover {
		color: var(--accent);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}
	.note {
		margin-top: 0.85rem;
		font-size: 0.85rem;
		color: var(--text-dim);
		max-width: 60ch;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		gap: clamp(2rem, 5vw, 4.5rem);
		margin-top: 2.75rem;
	}
	.main section + section,
	aside section + section {
		margin-top: 2.75rem;
	}
	h2.eyebrow {
		font-weight: 500;
		margin-bottom: 1rem;
	}
	.summary {
		font-size: 1.1rem;
		color: var(--text);
		max-width: 68ch;
	}

	.jobs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}
	.job {
		padding: clamp(1.25rem, 3vw, 1.75rem);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-card);
	}
	.job-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}
	h3 {
		font-size: 1.35rem;
	}
	.meta {
		font-size: 0.8rem;
		color: var(--text-dim);
	}
	.roles {
		list-style: none;
		margin: 1.25rem 0 0;
		padding: 0;
		display: grid;
		gap: 1.5rem;
	}
	.role {
		position: relative;
		padding-left: 1.4rem;
		border-left: 1px solid var(--border-strong);
	}
	.role::before {
		content: '';
		position: absolute;
		left: -5px;
		top: 0.45rem;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--gradient);
		box-shadow: 0 0 10px rgb(124 242 201 / 0.4);
	}
	.role-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		margin-bottom: 0.5rem;
	}
	h4 {
		font-size: 1.05rem;
		color: var(--accent);
	}
	.role p {
		color: var(--text-muted);
	}
	.highlights {
		margin-top: 0.85rem;
		display: grid;
		gap: 0.5rem;
	}
	.highlights li {
		position: relative;
		padding-left: 1.1rem;
		color: var(--text-muted);
		font-size: 0.95rem;
	}
	.highlights li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 6px;
		height: 1px;
		background: var(--accent);
	}

	aside {
		align-self: start;
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
	}
	.education {
		display: grid;
		gap: 1rem;
	}
	.education li {
		display: grid;
		gap: 0.15rem;
	}
	.education strong {
		font-weight: 600;
		line-height: 1.35;
	}
	.education span {
		color: var(--text-muted);
		font-size: 0.92rem;
	}
	.links {
		display: grid;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
		aside {
			position: static;
		}
	}
</style>
