<script lang="ts">
	import '../app.css';
	import Nav from '#lib/components/Nav.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<a class="skip" href="#main">Skip to content</a>
<Nav />
<main id="main">
	{@render children()}
</main>
<Footer />

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -100px;
		z-index: 100;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: var(--text);
		color: var(--bg);
	}
	.skip:focus {
		top: 1rem;
	}
</style>
