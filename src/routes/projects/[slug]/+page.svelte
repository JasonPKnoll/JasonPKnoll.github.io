<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft, ArrowRight, ExternalLink, Trophy } from '@lucide/svelte';
	import BrandIcon from '#lib/components/BrandIcon.svelte';
	import MediaFrame from '#lib/components/MediaFrame.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { categories } from '#lib/projects.ts';
	import { reveal } from '#lib/reveal.ts';
	import { breadcrumbs, projectPage } from '#lib/schema.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const project = $derived(data.project);
	const isTall = (s: { media?: { width: number; height: number }[] }) =>
		!!s.media?.length && s.media[0].height > s.media[0].width;
</script>

<Seo
	title={project.name}
	description={project.summary}
	type="article"
	image={project.cover.img.src}
	imageAlt={project.coverAlt}
	imageSize={{ width: project.cover.img.w, height: project.cover.img.h }}
	jsonLd={[
		projectPage(project, `/projects/${project.slug}`),
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: 'Projects', path: '/projects' },
			{ name: project.name, path: `/projects/${project.slug}` }
		])
	]}
/>

<article>
	<header class="container head">
		<a class="back mono" href={resolve('/projects')}><ArrowLeft size={14} /> All projects</a>

		<div class="title-row">
			<div>
				<p class="eyebrow">{project.kicker} · {categories[project.category]}</p>
				<h1>{project.name}</h1>
			</div>
			{#if project.status}<span class="status mono">{project.status}</span>{/if}
		</div>

		{#if project.highlight}
			<p class="highlight"><Trophy size={16} /> {project.highlight}</p>
		{/if}

		<p class="lede">{project.description}</p>

		<div class="meta">
			<ul class="tech" aria-label="Technologies">
				{#each project.tech as t (t)}<li class="chip">{t}</li>{/each}
			</ul>
			<div class="links">
				{#each project.links as link (link.href)}
					<a class="btn" href={link.href} target="_blank" rel="noopener noreferrer">
						{#if link.href.includes('github.com')}<BrandIcon name="github" size={16} />{:else}<ExternalLink
								size={16}
							/>{/if}
						{link.label}
					</a>
				{/each}
			</div>
		</div>

		<div class="cover">
			<enhanced:img src={project.cover} alt={project.coverAlt} sizes="(min-width: 1160px) 1100px, 100vw" />
		</div>
	</header>

	{#if project.groups.length}
		<div class="container body">
			{#if project.groups.length > 1}
				<nav class="toc" aria-label="On this page">
					<p class="mono">On this page</p>
					<ol>
						{#each project.groups as group, gi (group.title)}
							<li><a href="#g-{gi}">{group.title}</a></li>
						{/each}
					</ol>
				</nav>
			{/if}

			<div class="groups">
				{#each project.groups as group, gi (group.title)}
					<section id="g-{gi}" class="group">
						<h2 class="reveal" {@attach reveal()}>
							<span class="mono num">{String(gi + 1).padStart(2, '0')}</span>
							{group.title}
						</h2>
						{#if group.intro}<p class="intro reveal" {@attach reveal()}>{group.intro}</p>{/if}

						{#each group.sections as section (section.title)}
							<div class="feature reveal" class:side={isTall(section)} {@attach reveal()}>
								<div class="text">
									<h3>{section.title}</h3>
									{#each section.body ?? [] as p, pi (pi)}<p>{p}</p>{/each}
								</div>
								{#if section.media}
									<div class="media">
										{#each section.media as m (m.src)}<MediaFrame media={m} />{/each}
									</div>
								{/if}
								{#if section.table}
									<div class="table-wrap">
										<table>
											<thead>
												<tr>{#each section.table.columns as col (col)}<th>{col}</th>{/each}</tr>
											</thead>
											<tbody>
												{#each section.table.rows as row, ri (ri)}
													<tr>
														{#each row as cell, ci (ci)}
															<td class:code={ci === 0 || (ci < row.length - 1 && cell.startsWith('!'))}
																>{cell || '—'}</td
															>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/if}
							</div>
						{/each}
					</section>
				{/each}
			</div>
		</div>
	{/if}

	<nav class="container pager" aria-label="More projects">
		<a href={resolve('/projects/[slug]', { slug: data.prev.slug })}>
			<span class="mono"><ArrowLeft size={14} /> Previous</span>
			<strong>{data.prev.name}</strong>
		</a>
		<a class="next" href={resolve('/projects/[slug]', { slug: data.next.slug })}>
			<span class="mono">Next <ArrowRight size={14} /></span>
			<strong>{data.next.name}</strong>
		</a>
	</nav>
</article>

<style>
	.head {
		padding-top: calc(var(--nav-h) + clamp(2rem, 6vw, 4rem));
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--text-dim);
		margin-bottom: 2rem;
		transition: color 0.2s;
	}
	.back:hover {
		color: var(--text);
	}
	.title-row {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h1 {
		font-size: clamp(2.4rem, 6vw, 4rem);
		letter-spacing: -0.035em;
		margin-top: 0.6rem;
	}
	.status {
		font-size: 0.75rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		color: #f5d17a;
		border: 1px solid rgb(245 209 122 / 0.35);
		background: rgb(245 209 122 / 0.08);
	}
	.highlight {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.25rem;
		color: #f5d17a;
		font-weight: 500;
	}
	.lede {
		margin-top: 1.25rem;
		font-size: clamp(1.05rem, 1.8vw, 1.25rem);
		color: var(--text-muted);
		max-width: 65ch;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin: 2rem 0 2.5rem;
	}
	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.cover {
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid var(--border);
		max-height: 520px;
		background: var(--bg-raised);
	}
	.cover :global(picture) {
		height: 100%;
	}
	.cover :global(img) {
		width: 100%;
		height: 100%;
		max-height: 520px;
		object-fit: cover;
	}

	/* ---------- Body ---------- */
	.body {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 3rem;
		margin-top: clamp(3rem, 8vw, 5rem);
	}
	.body:not(:has(.toc)) {
		grid-template-columns: 1fr;
	}
	.toc {
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
		align-self: start;
	}
	.toc p {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		margin-bottom: 0.75rem;
	}
	.toc ol {
		list-style: none;
		margin: 0;
		padding: 0 0 0 0.9rem;
		border-left: 1px solid var(--border);
		display: grid;
		gap: 0.5rem;
	}
	.toc a {
		color: var(--text-muted);
		font-size: 0.92rem;
		transition: color 0.2s;
	}
	.toc a:hover {
		color: var(--accent);
	}
	.groups {
		display: grid;
		gap: clamp(4rem, 8vw, 6rem);
		min-width: 0;
	}
	.group h2 {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		font-size: clamp(1.6rem, 3vw, 2.1rem);
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 2rem;
	}
	.num {
		font-size: 0.85rem;
		color: var(--accent);
		font-weight: 500;
	}
	.intro {
		color: var(--text-muted);
		font-size: 1.08rem;
		max-width: 70ch;
		margin-bottom: 2.5rem;
		padding-left: 1rem;
		border-left: 2px solid var(--accent);
	}
	.feature {
		display: grid;
		gap: 1.25rem;
		margin-bottom: 3.5rem;
	}
	.feature:last-child {
		margin-bottom: 0;
	}
	.text {
		display: grid;
		gap: 0.6rem;
		max-width: 68ch;
	}
	.text h3 {
		font-size: 1.25rem;
	}
	.text p {
		color: var(--text-muted);
	}
	.media {
		display: grid;
		gap: 1rem;
	}
	.feature.side {
		grid-template-columns: 1fr minmax(220px, 300px);
		align-items: center;
		gap: clamp(2rem, 5vw, 4rem);
		padding: clamp(1.5rem, 4vw, 2.5rem);
		border: 1px solid var(--border);
		border-radius: 20px;
		background: var(--bg-raised);
	}

	/* ---------- Tables ---------- */
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		grid-column: 1 / -1;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.75rem 1rem;
		vertical-align: top;
		border-bottom: 1px solid var(--border);
	}
	th {
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-dim);
		background: var(--bg-raised);
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody tr:hover {
		background: rgb(255 255 255 / 0.02);
	}
	td {
		color: var(--text-muted);
	}
	td.code {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: var(--accent);
		white-space: nowrap;
	}

	/* ---------- Pager ---------- */
	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: clamp(4rem, 10vw, 7rem);
	}
	.pager a {
		display: grid;
		gap: 0.35rem;
		padding: 1.25rem 1.5rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--bg-card);
		transition:
			border-color 0.2s,
			transform 0.2s var(--ease);
	}
	.pager a:hover {
		border-color: var(--border-strong);
		transform: translateY(-2px);
	}
	.pager span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--text-dim);
	}
	.pager strong {
		font-size: 1.1rem;
		font-weight: 600;
	}
	.pager .next {
		text-align: right;
		justify-items: end;
	}

	@media (max-width: 900px) {
		.body {
			grid-template-columns: 1fr;
		}
		.toc {
			display: none;
		}
	}
	@media (max-width: 640px) {
		.feature.side {
			grid-template-columns: 1fr;
		}
		.pager {
			grid-template-columns: 1fr;
		}
	}
</style>
