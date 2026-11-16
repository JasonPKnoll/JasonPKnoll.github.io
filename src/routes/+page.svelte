<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Mail } from '@lucide/svelte';
	import portrait from '#lib/assets/Portrait.jpg?enhanced';
	import BrandIcon from '#lib/components/BrandIcon.svelte';
	import HeroField from '#lib/components/HeroField.svelte';
	import ProjectCard from '#lib/components/ProjectCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Terminal from '#lib/components/Terminal.svelte';
	import { getProject, projects } from '#lib/projects.ts';
	import { reveal } from '#lib/reveal.ts';
	import { person, website } from '#lib/schema.ts';
	import { site } from '#lib/site.ts';

	// Help Network leads; Weatheraza only appears on the full projects page.
	const featured = getProject('help-network')!;
	const rest = projects.filter((p) => p !== featured && p.slug !== 'weatheraza');
</script>

<Seo type="profile" jsonLd={[person, website]} />

<!-- Hero -->
<section class="hero">
	<HeroField />
	<div class="container hero-inner">
		<div class="hero-copy">
			<h1 class="hero-in" style="--d: 0">
				{site.role}.<br />
				<span class="gradient-text">{site.tagline}</span>
			</h1>
			<p class="lede hero-in" style="--d: 1">{site.intro}</p>
			<div class="actions hero-in" style="--d: 2">
				<a class="btn btn-primary" href={resolve('/projects')}>
					View my work <ArrowRight size={18} />
				</a>
				<a class="btn" href="#contact">Get in touch</a>
			</div>
		</div>
		<div class="hero-terminal hero-in" style="--d: 1">
			<Terminal />
		</div>
	</div>
	<a class="scroll-hint mono" href="#about" aria-label="Scroll to about">scroll ↓</a>
</section>

<!-- About -->
<section id="about" class="section container">
	<header class="section-head reveal" {@attach reveal()}>
		<p class="eyebrow">About</p>
		<h2>From financial sales to building software</h2>
	</header>

	<div class="about">
		<div class="portrait reveal" {@attach reveal()}>
			<enhanced:img src={portrait} alt="Portrait of {site.name}" sizes="(min-width: 900px) 340px, 70vw" />
		</div>
		<div class="bio">
			{#each site.about as paragraph, i (i)}
				<p class="reveal" {@attach reveal(i * 80)}>{paragraph}</p>
			{/each}

			<div class="stack reveal" {@attach reveal(200)}>
				{#each Object.entries(site.stack) as [group, items] (group)}
					<div>
						<h3 class="mono">{group}</h3>
						<ul>
							{#each items as item (item)}<li class="chip">{item}</li>{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Work -->
<section id="work" class="section container">
	<header class="section-head split reveal" {@attach reveal()}>
		<div>
			<p class="eyebrow">Selected work</p>
			<h2>Things I've built</h2>
		</div>
		<a class="btn" href={resolve('/projects')}>All projects <ArrowRight size={16} /></a>
	</header>

	<div class="featured reveal" {@attach reveal()}>
		<ProjectCard project={featured} featured />
	</div>
	<div class="grid">
		{#each rest as project, i (project.slug)}
			<div class="reveal" {@attach reveal(i * 90)}>
				<ProjectCard {project} />
			</div>
		{/each}
	</div>
</section>

<!-- Contact -->
<section id="contact" class="section container">
	<div class="contact reveal" {@attach reveal()}>
		<p class="eyebrow">Contact</p>
		<h2>Let's build something together.</h2>
		<p class="lede">
			If you're hiring, want to work on something together, or just want to talk VR and 3D, send me an email.
		</p>
		<a class="btn btn-primary email" href="mailto:{site.email}">
			<Mail size={18} />
			{site.email}
		</a>

		<ul class="contacts">
			{#each site.socials as c (c.name)}
				<li>
					<a href={c.href} target="_blank" rel="noopener noreferrer">
						<BrandIcon name={c.name} size={20} />
						<span>
							<strong>{c.label}</strong>
							<small class="mono">{c.handle}</small>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	/* ---------- Hero ---------- */
	.hero {
		position: relative;
		min-height: clamp(640px, 100svh, 1000px);
		display: flex;
		align-items: center;
		overflow: hidden;
		padding: calc(var(--nav-h) + 3rem) 0 5rem;
	}
	.hero::before {
		/* soft glow behind the copy */
		content: '';
		position: absolute;
		width: 60vmax;
		height: 60vmax;
		left: -20vmax;
		top: -25vmax;
		background: radial-gradient(closest-side, rgb(139 156 255 / 0.14), transparent);
		pointer-events: none;
	}
	/* Fade the terrain out at the bottom so it melts into the backdrop. */
	.hero :global(canvas) {
		mask-image: linear-gradient(#000 65%, transparent);
		-webkit-mask-image: linear-gradient(#000 65%, transparent);
	}
	.hero-inner {
		position: relative;
		display: grid;
		grid-template-columns: 1.25fr 1fr;
		gap: clamp(2rem, 5vw, 4rem);
		align-items: center;
	}
	h1 {
		font-size: clamp(2.4rem, 5.4vw, 4.2rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		margin: 0 0 1.4rem;
	}
	.lede {
		font-size: clamp(1.05rem, 1.6vw, 1.2rem);
		color: var(--text-muted);
		max-width: 38ch;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2.25rem;
	}
	.hero-in {
		opacity: 0;
		animation: rise 0.9s var(--ease) forwards;
		animation-delay: calc(var(--d) * 0.12s);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.scroll-hint {
		position: absolute;
		left: 50%;
		bottom: 1.75rem;
		transform: translateX(-50%);
		font-size: 0.75rem;
		color: var(--text-dim);
		transition: color 0.2s;
	}
	.scroll-hint:hover {
		color: var(--text);
	}

	/* ---------- Sections ---------- */
	.section {
		padding-top: clamp(4.5rem, 10vw, 8rem);
	}
	.section-head {
		margin-bottom: 3rem;
	}
	.section-head h2,
	.contact h2 {
		font-size: clamp(1.9rem, 3.6vw, 2.75rem);
		margin-top: 0.6rem;
	}
	.section-head.split {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	/* ---------- About ---------- */
	.about {
		display: grid;
		grid-template-columns: minmax(220px, 340px) 1fr;
		gap: clamp(2rem, 5vw, 4.5rem);
		align-items: start;
	}
	.portrait {
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid var(--border);
		aspect-ratio: 4 / 5;
		background: var(--bg-raised);
	}
	.portrait :global(picture) {
		height: 100%;
	}
	.portrait :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.bio {
		display: grid;
		gap: 1.25rem;
		font-size: 1.05rem;
		color: var(--text-muted);
	}
	.bio > p:first-child {
		color: var(--text);
		font-size: 1.15rem;
	}
	.stack {
		display: grid;
		gap: 1.25rem;
		margin-top: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-raised);
	}
	.stack h3 {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		margin-bottom: 0.6rem;
	}
	.stack ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* ---------- Work ---------- */
	.featured {
		margin-bottom: 1.5rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	/* ---------- Contact ---------- */
	.contact {
		text-align: center;
		padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 3rem);
		border: 1px solid var(--border);
		border-radius: 24px;
		background:
			radial-gradient(120% 120% at 50% 0%, rgb(124 242 201 / 0.08), transparent 60%),
			var(--bg-raised);
	}
	.contact .lede {
		margin: 1rem auto 2rem;
	}
	.email {
		font-size: 1rem;
	}
	.contacts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		list-style: none;
		margin: 2.5rem 0 0;
		padding: 0;
	}
	.contacts a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.1rem;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		text-align: left;
		color: var(--text-muted);
		transition:
			border-color 0.2s,
			color 0.2s,
			transform 0.2s var(--ease);
	}
	.contacts a:hover {
		color: var(--text);
		border-color: var(--border-strong);
		transform: translateY(-2px);
	}
	.contacts span {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}
	.contacts strong {
		font-weight: 550;
		font-size: 0.92rem;
		color: var(--text);
	}
	.contacts small {
		font-size: 0.72rem;
	}

	/* ---------- Responsive ---------- */
	@media (max-width: 960px) {
		.hero-inner {
			grid-template-columns: 1fr;
		}
		.hero-terminal {
			max-width: 520px;
		}
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 760px) {
		.about {
			grid-template-columns: 1fr;
		}
		.portrait {
			position: static;
			max-width: 280px;
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
