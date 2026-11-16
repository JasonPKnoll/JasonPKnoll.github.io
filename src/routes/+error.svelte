<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo title={String(page.status)} description="Page not found." noindex />

<section class="container">
	<p class="code mono gradient-text">{page.status}</p>
	<h1>{page.status === 404 ? "This page doesn't exist." : 'Something went wrong.'}</h1>
	<p class="lede">
		{page.status === 404
			? "The page you're looking for was moved or never existed."
			: page.error?.message}
	</p>
	<div class="actions">
		<a class="btn btn-primary" href={resolve('/')}>Back home</a>
		<a class="btn" href={resolve('/projects')}>See projects</a>
	</div>
</section>

<style>
	section {
		min-height: 80svh;
		display: grid;
		place-content: center;
		justify-items: center;
		text-align: center;
		padding-top: var(--nav-h);
	}
	.code {
		font-size: clamp(5rem, 18vw, 9rem);
		font-weight: 700;
		line-height: 1;
	}
	h1 {
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		margin-top: 1rem;
	}
	.lede {
		color: var(--text-muted);
		margin-top: 0.75rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 2rem;
	}
</style>
