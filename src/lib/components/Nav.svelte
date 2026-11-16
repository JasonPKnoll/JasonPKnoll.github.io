<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Menu, X } from '@lucide/svelte';
	import { site } from '#lib/site.ts';

	let open = $state(false);
	let scrolled = $state(false);

	const links = [
		{ href: resolve('/') + '#about', label: 'About' },
		{ href: resolve('/projects'), label: 'Projects' },
		{ href: resolve('/') + '#contact', label: 'Contact' }
	];

	const isActive = (href: string) =>
		!href.includes('#') && page.url.pathname.startsWith(href);

	$effect(() => {
		// close the mobile menu whenever we navigate
		page.url.pathname;
		open = false;
	});
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 8)} />

<header class:scrolled class:open>
	<nav class="container" aria-label="Main">
		<a class="brand" href={resolve('/')}>
			<span class="mark mono" aria-hidden="true">jk</span>
			<span>{site.name}</span>
		</a>

		<button
			class="toggle"
			aria-expanded={open}
			aria-controls="nav-links"
			onclick={() => (open = !open)}
		>
			<span class="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
			{#if open}<X size={22} />{:else}<Menu size={22} />{/if}
		</button>

		<ul id="nav-links">
			{#each links as link (link.label)}
				<li>
					<a
						href={link.href}
						aria-current={isActive(link.href) ? 'page' : undefined}
						onclick={() => (open = false)}>{link.label}</a
					>
				</li>
			{/each}
			<li>
				<a class="btn cta" href="mailto:{site.email}">Say hello</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	header {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 50;
		height: var(--nav-h);
		border-bottom: 1px solid transparent;
		transition:
			background 0.3s,
			border-color 0.3s,
			backdrop-filter 0.3s;
	}
	header.scrolled,
	header.open {
		background: rgb(10 11 15 / 0.75);
		backdrop-filter: blur(14px) saturate(140%);
		-webkit-backdrop-filter: blur(14px) saturate(140%);
		border-bottom-color: var(--border);
	}
	nav {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: var(--gradient);
		color: var(--bg);
		font-weight: 700;
		font-size: 0.85rem;
	}
	ul {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	ul a:not(.btn) {
		display: block;
		padding: 0.5rem 0.85rem;
		border-radius: 999px;
		color: var(--text-muted);
		font-size: 0.95rem;
		transition: color 0.2s;
	}
	ul a:not(.btn):hover,
	ul a[aria-current='page'] {
		color: var(--text);
	}
	.cta {
		margin-left: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}
	.toggle {
		display: none;
		background: none;
		border: 0;
		color: var(--text);
		padding: 0.5rem;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.toggle {
			display: block;
		}
		ul {
			position: absolute;
			top: var(--nav-h);
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			padding: 0.75rem clamp(1.25rem, 4vw, 2rem) 1.25rem;
			background: rgb(10 11 15 / 0.95);
			backdrop-filter: blur(14px);
			-webkit-backdrop-filter: blur(14px);
			border-bottom: 1px solid var(--border);
			display: none;
		}
		header.open ul {
			display: flex;
		}
		ul a:not(.btn) {
			padding: 0.75rem 0;
			font-size: 1.05rem;
		}
		.cta {
			margin: 0.5rem 0 0;
			justify-content: center;
		}
	}
</style>
