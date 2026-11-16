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
	import { HOME, complete, prompt, run, type Action, type Line } from '#lib/shell.ts';
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
	let cwd = $state<string[]>(HOME);
	let value = $state('');
	let past = $state<string[]>([]);
	let caret = $state(0);
	/** Position while stepping through history with the arrow keys. */
	let back = -1;
	let draft = '';
	let busy = $state(false);

	let input: HTMLInputElement;
	let screen: HTMLDivElement;
	let doom: HTMLDialogElement;
	/** The game only loads once someone finds and runs doom.exe. */
	let playing = $state(false);

	const DOOM_EMBED = 'https://archive.org/embed/DoomsharewareEpisode';
	const DOOM_PAGE = 'https://archive.org/details/DoomsharewareEpisode';

	async function say(...lines: Line[]) {
		entries = [...entries, ...lines.map((line) => ({ line }))];
		await scrollDown();
	}

	function closeDoom() {
		playing = false;
		say([{ t: 'doom.exe exited with code 0', tone: 'dim' }]);
		input?.focus({ preventScroll: true });
	}

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
		if (result.action?.kind === 'doom' && matchMedia('(hover: none) and (pointer: coarse)').matches) {
			say([{ t: 'doom.exe: this one needs a keyboard. Try it on a computer.', tone: 'coral' }]);
		} else if (result.action) go(result.action);
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
					break;
				case 'doom':
					playing = true;
					tick().then(() => doom.showModal());
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

<dialog
	class="doom"
	bind:this={doom}
	onclose={closeDoom}
	onclick={(e) => e.target === doom && doom.close()}
	aria-label="DOOM, shareware episode"
>
	{#if playing}
		<div class="window">
			<div class="bar">
				<span></span><span></span><span></span>
				<p class="mono">doom.exe</p>
				<button type="button" class="close mono" onclick={() => doom.close()} aria-label="Quit DOOM">quit ✕</button>
			</div>
			<iframe
				src={DOOM_EMBED}
				title="DOOM shareware episode, running in the Internet Archive emulator"
				allow="autoplay; fullscreen; gamepad"
				allowfullscreen
			></iframe>
			<p class="credit mono">
				DOOM shareware © id Software, played through the
				<a href={DOOM_PAGE} target="_blank" rel="noopener">Internet Archive</a>. Click the game to give it the
				keyboard. Click outside it or press quit to exit.
			</p>
		</div>
	{/if}
</dialog>

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
	/* doom.exe */
	.doom {
		width: min(1100px, 100vw - 2rem);
		max-width: none;
		max-height: none;
		padding: 0;
		border: 0;
		background: none;
		color: var(--text);
		overflow: visible;
	}
	.doom::backdrop {
		background: rgb(4 5 8 / 0.82);
		backdrop-filter: blur(6px);
	}
	.window {
		border-radius: var(--radius);
		background: #0d0f14;
		border: 1px solid var(--border-strong);
		box-shadow: 0 40px 120px -20px rgb(0 0 0 / 0.9);
		overflow: hidden;
	}
	.window .bar p {
		transform: none;
	}
	.close {
		all: unset;
		cursor: pointer;
		font-size: 0.72rem;
		color: var(--text-dim);
		padding: 0.15rem 0.5rem;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.close:hover,
	.close:focus-visible {
		color: var(--text);
		border-color: var(--border-strong);
	}
	iframe {
		display: block;
		width: 100%;
		/* Fill the screen but stay 4:3 like the original. */
		height: min(calc((min(1100px, 100vw - 2rem)) * 0.75), 100dvh - 9rem);
		border: 0;
		background: #000;
	}
	.credit {
		margin: 0;
		padding: 0.6rem 0.9rem;
		font-size: 0.7rem;
		color: var(--text-dim);
		border-top: 1px solid var(--border);
	}
	.credit a {
		color: var(--text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
