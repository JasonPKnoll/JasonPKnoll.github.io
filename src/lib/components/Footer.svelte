<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '#lib/site.ts';
	import BrandIcon from './BrandIcon.svelte';

	const socials = [
		{ name: 'github', label: 'GitHub', href: site.socials.github },
		{ name: 'linkedin', label: 'LinkedIn', href: site.socials.linkedin },
		{ name: 'x', label: 'X (Twitter)', href: site.socials.x },
		{ name: 'discord', label: 'Discord', href: site.socials.discord },
		{ name: 'itch', label: 'itch.io', href: site.socials.itch }
	] as const;
</script>

<footer>
	<div class="container inner">
		<div>
			<a class="name" href={resolve('/')}>{site.name}</a>
			<p class="mono small">© {new Date().getFullYear()} · Built with SvelteKit</p>
		</div>
		<ul aria-label="Social links">
			{#each socials as s (s.name)}
				<li>
					<a href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}>
						<BrandIcon name={s.name} size={18} />
						<span class="sr-only">{s.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--border);
		padding: 2.5rem 0;
		margin-top: 6rem;
	}
	.inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.name {
		font-weight: 600;
	}
	.small {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.25rem;
	}
	ul {
		display: flex;
		gap: 0.35rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	a[title] {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		color: var(--text-muted);
		transition:
			color 0.2s,
			background 0.2s;
	}
	a[title]:hover {
		color: var(--text);
		background: rgb(255 255 255 / 0.05);
	}
</style>
