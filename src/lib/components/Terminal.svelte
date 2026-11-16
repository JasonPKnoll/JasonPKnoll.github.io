<script lang="ts">
	import { projects } from '#lib/projects.ts';
	import { site } from '#lib/site.ts';

	type Line = { prompt?: string; text: string; tone?: 'muted' | 'accent' };

	const lines: Line[] = [
		{ prompt: '~', text: 'whoami' },
		{ text: `${site.name.toLowerCase().replace(' ', '-')} — ${site.role.toLowerCase()}`, tone: 'accent' },
		{ prompt: '~', text: 'cat interests.txt' },
		{ text: 'web apps · bots · virtual reality · 3D', tone: 'muted' },
		{ prompt: '~', text: 'ls projects/' },
		{ text: projects.map((p) => p.slug).join('  '), tone: 'muted' }
	];
</script>

<div class="terminal" role="img" aria-label="Terminal showing a short introduction">
	<div class="bar" aria-hidden="true">
		<span></span><span></span><span></span>
		<p class="mono">zsh — jk@portfolio</p>
	</div>
	<pre class="mono" aria-hidden="true">{#each lines as line, i (i)}<span
				class="line {line.tone ?? ''}"
				style="--i: {i}"
				>{#if line.prompt}<span class="prompt">{line.prompt} $ </span>{/if}{line.text}</span
			>{/each}<span class="line" style="--i: {lines.length}"><span class="prompt">~ $ </span><span
					class="cursor"
				></span></span
		></pre>
</div>

<style>
	.terminal {
		width: 100%;
		border-radius: var(--radius);
		background: rgb(17 19 25 / 0.72);
		border: 1px solid var(--border);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow:
			0 30px 80px -30px rgb(0 0 0 / 0.7),
			0 0 0 1px rgb(255 255 255 / 0.02) inset;
		overflow: hidden;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0.7rem 0.9rem;
		border-bottom: 1px solid var(--border);
	}
	.bar span {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--border-strong);
	}
	.bar p {
		margin-left: auto;
		margin-right: auto;
		transform: translateX(-20px);
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	pre {
		margin: 0;
		padding: 1.1rem 1.2rem 1.3rem;
		font-size: 0.82rem;
		line-height: 1.75;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--text);
	}
	.line {
		display: block;
		opacity: 0;
		animation: appear 0.35s var(--ease) forwards;
		animation-delay: calc(0.35s + var(--i) * 0.28s);
	}
	.line.muted {
		color: var(--text-muted);
	}
	.line.accent {
		color: var(--accent);
	}
	.prompt {
		color: var(--accent-2);
	}
	.cursor {
		display: inline-block;
		width: 0.55em;
		height: 1.05em;
		vertical-align: -0.15em;
		background: var(--accent);
		animation: blink 1.1s steps(1) infinite;
	}
	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
