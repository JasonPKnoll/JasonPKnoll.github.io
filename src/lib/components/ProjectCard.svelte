<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight, Trophy } from '@lucide/svelte';
	import type { Project } from '#lib/projects.ts';
	import { categories } from '#lib/projects.ts';

	let { project, featured = false }: { project: Project; featured?: boolean } = $props();
</script>

<a class="card" class:featured href={resolve('/projects/[slug]', { slug: project.slug })}>
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
			{project.name}
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
</a>

<style>
	.card {
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
