<script lang="ts">
	import ProjectCard from '#lib/components/ProjectCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { categories, projects } from '#lib/projects.ts';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	type Filter = 'all' | keyof typeof categories;
	let filter: Filter = $state('all');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'All' },
		...Object.entries(categories).map(([id, label]) => ({ id: id as Filter, label }))
	];

	const count = (id: Filter) =>
		id === 'all' ? projects.length : projects.filter((p) => p.category === id).length;

	const visible = $derived(
		filter === 'all' ? projects : projects.filter((p) => p.category === filter)
	);
</script>

<Seo title="Projects" description="Personal and Turing School projects by Jason Knoll." />

<section class="container page">
	<header>
		<p class="eyebrow">Projects</p>
		<h1>Work &amp; experiments</h1>
		<p class="lede">
			Personal projects in VR and bot-building, plus full-stack apps built at the Turing School of
			Software &amp; Design.
		</p>
	</header>

	<div class="filters" role="group" aria-label="Filter projects">
		{#each filters as f (f.id)}
			<button aria-pressed={filter === f.id} onclick={() => (filter = f.id)}>
				{f.label}
				<span class="mono">{count(f.id)}</span>
			</button>
		{/each}
	</div>

	<ul class="grid">
		{#each visible as project (project.slug)}
			<li animate:flip={{ duration: 400 }} in:fade={{ duration: 250 }}>
				<ProjectCard {project} />
			</li>
		{/each}
	</ul>
</section>

<style>
	.page {
		padding-top: calc(var(--nav-h) + clamp(3rem, 8vw, 6rem));
	}
	h1 {
		font-size: clamp(2.4rem, 5vw, 3.75rem);
		letter-spacing: -0.035em;
		margin: 0.75rem 0 1rem;
	}
	.lede {
		color: var(--text-muted);
		font-size: 1.1rem;
		max-width: 56ch;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 2.5rem 0 2rem;
	}
	.filters button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s,
			background 0.2s;
	}
	.filters button:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
	.filters button[aria-pressed='true'] {
		background: var(--text);
		border-color: var(--text);
		color: var(--bg);
	}
	.filters span {
		font-size: 0.72rem;
		opacity: 0.6;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
		gap: 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
