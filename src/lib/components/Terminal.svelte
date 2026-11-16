<!--
	The hero terminal. It plays a short intro, then becomes a small working
	shell: click in and type (help, ls, cd fido-bot, cat about.txt, open github).
	Commands that point somewhere navigate there. See #lib/shell.ts.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { projects } from '#lib/projects.ts';
	import { complete, prompt, run, type Action, type Line } from '#lib/shell.ts';
	import { site } from '#lib/site.ts';

	type Entry = { prompt?: string; cmd?: string; line?: Line; intro?: number };

	const intro: Entry[] = ([
		{ prompt: '~', cmd: 'whoami' },
		{ line: [{ t: `${site.name.toLowerCase().replace(' ', '-')}, ${site.role.toLowerCase()}`, tone: 'accent' }] },
		{ prompt: '~', cmd: 'cat interests.txt' },
		{ line: [{ t: 'web apps · bots · virtual reality · 3D', tone: 'muted' }] },
		{ prompt: '~', cmd: 'ls projects/' },
		{
			line: projects.flatMap((p, i) => [
				{ t: p.slug, tone: 'blue' as const, run: `cd ${p.slug}` },
				...(i < projects.length - 1 ? [{ t: '  ' }] : [])
			])
		},
		{
			line: [
				{ t: '# type ', tone: 'dim' },
				{ t: 'help', tone: 'accent', run: 'help' },
				{ t: ' or try ', tone: 'dim' },
				{ t: 'cd fido-bot', tone: 'accent', run: 'cd fido-bot' }
			]
		}
	] satisfies Entry[]).map((e, i) => ({ ...e, intro: i }));

	let entries = $state<Entry[]>(intro);
	let cwd = $state<string[]>([]);
	let value = $state('');
	let past = $state<string[]>([]);
	let caret = $state(0);
	/** Position while stepping through history with the arrow keys. */
	let back = -1;
	let draft = '';
	let busy = $state(false);

	let input: HTMLInputElement;
	let screen: HTMLDivElement;

	async function scrollDown() {
		await tick();
		screen.scrollTop = screen.scrollHeight;
	}

	async function exec(cmd: string) {
		if (busy) return;
		const text = cmd.trim();
		const here = prompt(cwd);
		if (text) past = [...past.filter((h) => h !== text), text].slice(-50);
		back = -1;
		value = '';

		const result = run(text, { cwd, history: past });
		if (result.clear) entries = [];
		else entries = [...entries, { prompt: here, cmd: text }, ...result.lines.map((line) => ({ line }))];
		if (result.cwd) cwd = result.cwd;
		await scrollDown();
		if (result.action) go(result.action);
	}

	function go(action: Action) {
		busy = true;
		// A short beat so the "opening" line reads before the page changes.
		setTimeout(() => {
			busy = false;
			switch (action.kind) {
				case 'project':
					goto(resolve('/projects/[slug]', { slug: action.slug }));
					break;
				case 'page':
					goto(resolve(action.path));
					break;
				case 'section':
					document.getElementById(action.id)?.scrollIntoView({ behavior: 'smooth' });
					window.history.replaceState(window.history.state, '', `#${action.id}`);
					break;
				case 'file': {
					const a = document.createElement('a');
					a.href = action.href;
					a.download = action.href.split('/').pop() ?? '';
					a.click();
					break;
				}
				case 'external':
					if (action.href.startsWith('mailto:')) location.href = action.href;
					else window.open(action.href, '_blank', 'noopener');
			}
		}, 450);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			exec(value);
		} else if (e.key === 'Tab') {
			e.preventDefault();
			const { input: next, options } = complete(value, cwd);
			if (options.length) {
				entries = [
					...entries,
					{ prompt: prompt(cwd), cmd: value },
					{ line: [{ t: options.join('  '), tone: 'muted' }] }
				];
				scrollDown();
			}
			value = next;
			toEnd();
		} else if (e.key === 'ArrowUp') {
			if (!past.length) return;
			e.preventDefault();
			if (back === -1) draft = value;
			back = Math.min(back + 1, past.length - 1);
			value = past[past.length - 1 - back];
			toEnd();
		} else if (e.key === 'ArrowDown') {
			if (back === -1) return;
			e.preventDefault();
			back -= 1;
			value = back === -1 ? draft : past[past.length - 1 - back];
			toEnd();
		} else if (e.key === 'l' && e.ctrlKey) {
			e.preventDefault();
			entries = [];
		} else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
			e.preventDefault();
			entries = [...entries, { prompt: prompt(cwd), cmd: `${value}^C` }];
			value = '';
			scrollDown();
		}
	}

	async function toEnd() {
		await tick();
		input.setSelectionRange(value.length, value.length);
		caret = value.length;
	}
	const track = () => (caret = input.selectionStart ?? value.length);

	/** Clicking anywhere in the window types into the prompt, unless you are selecting text. */
	function focus(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('button')) return;
		if (window.getSelection()?.toString()) return;
		input.focus({ preventScroll: true });
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="terminal" onclick={focus}>
	<div class="bar" aria-hidden="true">
		<span></span><span></span><span></span>
		<p class="mono">jk@portfolio: {prompt(cwd)}</p>
	</div>
	<div class="screen mono" bind:this={screen}>
		<div role="log" aria-live="polite" aria-label="Terminal output">
			{#each entries as entry, i (i)}
				<div class="line" class:intro={entry.intro !== undefined} style="--i: {entry.intro ?? 0}">
					{#if entry.prompt !== undefined}<span class="prompt">{`${entry.prompt} $ `}</span><span class="cmd">{entry.cmd}</span>{/if}
					{#if entry.line}{#each entry.line as seg, j (j)}{#if seg.run}<button
									type="button"
									class="seg {seg.tone ?? ''}"
									tabindex="-1"
									onclick={() => exec(seg.run!)}>{seg.t}</button
								>{:else}<span class="seg {seg.tone ?? ''}">{seg.t}</span>{/if}{/each}{/if}
				</div>
			{/each}
		</div>
		<label class="line input intro" style="--i: {intro.length}">
			<span class="prompt">{`${prompt(cwd)} $ `}</span>
			<span class="field">
				<input
					bind:this={input}
					bind:value
					{onkeydown}
					oninput={track}
					onkeyup={track}
					onselect={track}
					type="text"
					aria-label="Type a command, for example help or cd fido-bot"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="go"
					disabled={busy}
				/>
				<span class="ghost" aria-hidden="true"
					>{value.slice(0, caret)}<span class="cursor">{value[caret] ?? ' '}</span
					>{value.slice(caret + 1)}</span
				>
			</span>
		</label>
	</div>
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
		cursor: text;
		transition: border-color 0.2s;
	}
	.terminal:focus-within {
		border-color: var(--border-strong);
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
	.screen {
		height: 17.5rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.1rem 1.2rem 1.3rem;
		font-size: 0.82rem;
		line-height: 1.75;
		word-break: break-word;
		color: var(--text);
		scrollbar-width: thin;
		scrollbar-color: var(--border-strong) transparent;
	}
	.line {
		display: block;
		min-height: 1.75em;
	}
	.prompt,
	.cmd,
	.seg {
		white-space: pre-wrap;
	}
	.line.intro {
		opacity: 0;
		animation: appear 0.35s var(--ease) forwards;
		animation-delay: calc(0.35s + var(--i) * 0.28s);
	}
	.seg.muted {
		color: var(--text-muted);
	}
	.seg.dim {
		color: var(--text-dim);
	}
	.seg.accent {
		color: var(--accent);
	}
	.seg.blue {
		color: var(--accent-2);
	}
	.seg.coral {
		color: #ff8a7a;
	}
	button.seg {
		all: unset;
		cursor: pointer;
		border-radius: 3px;
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
		text-underline-offset: 3px;
	}
	button.seg:hover {
		background: rgb(255 255 255 / 0.06);
		text-decoration-color: currentColor;
	}
	.prompt {
		color: var(--accent-2);
	}

	.input {
		display: flex;
		white-space: pre;
		cursor: text;
	}
	.field {
		position: relative;
		flex: 1;
		min-width: 0;
	}
	/* The real input is invisible; the ghost copy draws the text and a block cursor. */
	input {
		position: absolute;
		inset: 0;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		/* 16px keeps iOS from zooming in on focus; the text itself is invisible. */
		font-size: max(16px, 1em);
		color: transparent;
		caret-color: transparent;
		outline: none;
	}
	.ghost {
		pointer-events: none;
		white-space: pre-wrap;
		word-break: break-all;
	}
	.cursor {
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	.terminal:focus-within .cursor {
		background: var(--accent);
		color: var(--bg);
		box-shadow: none;
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
			background: transparent;
			color: inherit;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line.intro {
			animation: none;
			opacity: 1;
		}
	}
</style>
