<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight, Trophy } from '@lucide/svelte';
	import type { Project } from '#lib/projects.ts';
	import { categories } from '#lib/projects.ts';
	import BrandIcon from './BrandIcon.svelte';

	let { project, featured = false }: { project: Project; featured?: boolean } = $props();

	// One repo reads "Code"; several use the first word of each label ("Backend", "Frontend").
	const short = (label: string) => (project.links.length > 1 ? label.split(' ')[0] : 'Code');
	const full = (label: string) => (label.includes('GitHub') ? label : `${label} on GitHub`);
</script>

<!-- The title link stretches over the whole card, so the repo links can sit on top of it. -->
<article class="card" class:featured>
	{#if project.links.length}
		<div class="repos">
			{#each project.links as link (link.href)}
				<a
					class="repo"
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="{project.name}: {full(link.label)}"
					title={full(link.label)}
				>
					<BrandIcon name="github" size={15} />
					{short(link.label)}
				</a>
			{/each}
		</div>
	{/if}
	<div
		class="cover"
		class:contain={!!project.coverContain}
		style:background={project.coverContain}
	>
		<enhanced:img
			src={project.cover}
			alt={project.coverAlt}
			sizes={featured ? '(min-width: 900px) 640px, 100vw' : '(min-width: 900px) 380px, 100vw'}
		/>
	</div>
	<div class="body">
		<div class="meta">
			<span class="eyebrow">{project.kicker}</span>
			<span class="cat mono">{categories[project.category]}</span>
		</div>
		<h3>
			<a class="main" href={resolve('/projects/[slug]', { slug: project.slug })}>{project.name}</a>
			<ArrowUpRight class="arrow" size={20} />
		</h3>
		{#if project.highlight}
			<p class="highlight"><Trophy size={14} /> {project.highlight}</p>
		{/if}
		<p class="summary">{project.summary}</p>
		<ul class="tech" aria-label="Technologies">
			{#each project.tech.slice(0, featured ? 6 : 4) as t (t)}
				<li class="chip">{t}</li>
			{/each}
		</ul>
	</div>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: var(--radius);
		background: var(--bg-card);
		border: 1px solid var(--border);
		overflow: hidden;
		transition:
			transform 0.35s var(--ease),
			border-color 0.35s,
			box-shadow 0.35s;
	}
	.card:hover {
		transform: translateY(-4px);
		border-color: var(--border-strong);
		box-shadow: 0 24px 60px -30px rgb(124 242 201 / 0.25);
	}
	.main::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
	}
	.main:focus-visible {
		outline: none;
	}
	.card:has(.main:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.repos {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		z-index: 2;
		display: flex;
		gap: 0.4rem;
	}
	.repo {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem 0.4rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		background: rgb(10 11 15 / 0.78);
		border: 1px solid rgb(255 255 255 / 0.18);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow: 0 4px 14px rgb(0 0 0 / 0.35);
		transition:
			background 0.2s,
			color 0.2s,
			border-color 0.2s,
			transform 0.2s var(--ease);
	}
	.repo:hover {
		background: var(--text);
		color: var(--bg);
		border-color: var(--text);
		transform: translateY(-1px);
	}
	.cover {
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: var(--bg-raised);
		border-bottom: 1px solid var(--border);
	}
	.cover :global(picture) {
		height: 100%;
	}
	.cover :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s var(--ease);
	}
	.cover.contain {
		display: grid;
		place-items: center;
	}
	.cover.contain :global(picture) {
		height: auto;
		width: 100%;
	}
	.cover.contain :global(img) {
		height: auto;
		object-fit: contain;
	}
	.card:hover .cover :global(img) {
		transform: scale(1.04);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 1.25rem 1.35rem 1.4rem;
		flex: 1;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.cat {
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	h3 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 1.3rem;
	}
	h3 :global(.arrow) {
		color: var(--text-dim);
		transition:
			transform 0.3s var(--ease),
			color 0.3s;
	}
	.card:hover h3 :global(.arrow) {
		color: var(--accent);
		transform: translate(2px, -2px);
	}
	.highlight {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: #f5d17a;
	}
	.summary {
		color: var(--text-muted);
		font-size: 0.95rem;
	}
	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		list-style: none;
		padding: 0;
		margin: auto 0 0;
		padding-top: 0.4rem;
	}

	.featured {
		display: grid;
		grid-template-columns: 1.15fr 1fr;
	}
	.featured .cover {
		aspect-ratio: auto;
		min-height: 100%;
		border-bottom: 0;
		border-right: 1px solid var(--border);
	}
	.featured .body {
		padding: 2rem;
		justify-content: center;
	}
	.featured h3 {
		font-size: 1.75rem;
	}
	@media (max-width: 860px) {
		.featured {
			display: flex;
		}
		.featured .cover {
			aspect-ratio: 16 / 10;
			border-right: 0;
			border-bottom: 1px solid var(--border);
		}
		.featured .body {
			padding: 1.25rem 1.35rem 1.4rem;
		}
	}
</style>
