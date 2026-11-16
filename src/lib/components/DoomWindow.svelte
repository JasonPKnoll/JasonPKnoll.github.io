<!--
	doom.exe from the hero terminal. The game itself runs in
	static/games/doom/play.html inside an iframe, which keeps js-dos and its
	global stylesheet away from the rest of the site. That page reports its
	progress here with postMessage, and removing the iframe stops everything.
	Nothing loads until someone finds and runs doom.exe.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { onexit }: { onexit: () => void } = $props();

	type Step = { text: string; state: 'run' | 'ok' | 'fail' };
	let steps = $state<Step[]>([]);
	let ready = $state(false);
	let failed = $state(false);

	let dialog: HTMLDialogElement;
	let frame: HTMLIFrameElement;
	let closing = false;

	type Message = { step?: string; ok?: boolean; fail?: string; ready?: boolean };

	function onmessage(e: MessageEvent) {
		if (e.origin !== location.origin || e.source !== frame?.contentWindow) return;
		const msg = (e.data as { doom?: Message })?.doom;
		if (!msg) return;
		const last = steps[steps.length - 1];
		if (msg.step) steps.push({ text: msg.step, state: 'run' });
		if (msg.ok && last) last.state = 'ok';
		if (msg.fail) {
			if (last) last.state = 'fail';
			failed = true;
		}
		if (msg.ready) {
			if (last) last.state = 'ok';
			ready = true;
			frame.focus();
		}
	}

	onMount(() => {
		dialog.showModal();
		window.addEventListener('message', onmessage);
		return () => window.removeEventListener('message', onmessage);
	});

	function quit() {
		if (closing) return;
		closing = true;
		dialog.close();
	}
</script>

<dialog
	bind:this={dialog}
	class="doom"
	aria-label="DOOM, shareware episode"
	onclose={() => {
		closing = true;
		onexit();
	}}
	oncancel={(e) => e.preventDefault()}
	onclick={(e) => e.target === dialog && quit()}
>
	<div class="window">
		<div class="bar">
			<div class="lights">
				<button type="button" class="light red" onclick={quit} aria-label="Quit DOOM" title="Quit">
					<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M2 2l4 4M6 2L2 6" /></svg>
				</button>
				<span class="light yellow" aria-hidden="true"></span>
				<button
					type="button"
					class="light green"
					onclick={() => frame?.requestFullscreen?.()}
					aria-label="Full screen"
					title="Full screen"
				>
					<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M2 5V2h3M6 3v3H3" /></svg>
				</button>
			</div>
			<p class="mono">doom.exe</p>
			<button type="button" class="close mono" onclick={quit} aria-label="Quit DOOM">quit ✕</button>
		</div>
		<div class="stage">
			<iframe
				bind:this={frame}
				class="screen"
				src="/games/doom/play.html"
				title="DOOM shareware episode"
				allow="autoplay; fullscreen; gamepad"
			></iframe>
			{#if !ready}
				<div class="boot mono" aria-live="polite">
					{#each steps as s, i (i)}
						<p>
							<span class="text">{s.text}</span>
							<span class="state {s.state}">{s.state === 'run' ? '...' : s.state === 'ok' ? 'ok' : 'failed'}</span>
						</p>
					{/each}
					{#if failed}
						<p class="err">Something went wrong loading DOOM. Close this and try running it again.</p>
					{/if}
				</div>
			{/if}
		</div>
		<div class="foot mono">
			<span><kbd>←↑→↓</kbd> move</span>
			<span><kbd>ctrl</kbd> fire</span>
			<span><kbd>space</kbd> open</span>
			<span><kbd>1-7</kbd> weapons</span>
			<span><kbd>esc</kbd> menu</span>
			<span class="credit">DOOM shareware © id Software</span>
		</div>
	</div>
</dialog>

<style>
	.doom {
		/* As wide as fits, keeping the game area 4:3 under the title bar and footer. */
		--chrome: 5.4rem;
		width: min(1000px, 100vw - 2rem, (100dvh - 2rem - var(--chrome)) * 4 / 3);
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
	.bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0.55rem 0.7rem 0.55rem 0.9rem;
		border-bottom: 1px solid var(--border);
	}
	/* macOS style window controls: red quits, green goes full screen. */
	.lights {
		display: flex;
		gap: 8px;
	}
	.light {
		all: unset;
		display: grid;
		place-items: center;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.25);
	}
	button.light {
		cursor: pointer;
	}
	.red {
		background: #ff5f57;
	}
	.yellow {
		background: var(--border-strong);
	}
	.green {
		background: #28c840;
	}
	.light svg {
		width: 8px;
		height: 8px;
		fill: none;
		stroke: rgb(0 0 0 / 0.6);
		stroke-width: 1.3;
		stroke-linecap: round;
		opacity: 0;
	}
	.lights:hover svg,
	.light:focus-visible svg {
		opacity: 1;
	}
	.light:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.bar p {
		margin: 0 auto;
		font-size: 0.72rem;
		color: var(--text-dim);
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

	.stage {
		position: relative;
		aspect-ratio: 4 / 3;
		background: #000;
	}
	.screen {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: #000;
	}
	.boot {
		position: absolute;
		inset: 0;
		padding: 1.2rem 1.4rem;
		background: #0b0c10;
		font-size: 0.82rem;
		line-height: 1.9;
		color: var(--text-muted);
	}
	.boot p {
		display: flex;
		gap: 0.75rem;
		margin: 0;
		max-width: 34rem;
	}
	.boot .text {
		flex: 1;
		overflow: hidden;
		white-space: nowrap;
	}
	.boot .text::after {
		content: ' ................................................................';
		color: var(--border-strong);
	}
	.state.run {
		color: var(--text-dim);
		animation: blink 1s steps(1) infinite;
	}
	.state.ok {
		color: var(--accent);
	}
	.state.fail,
	.err {
		color: #ff8a7a;
	}
	@keyframes blink {
		50% {
			opacity: 0.3;
		}
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 1rem;
		padding: 0.55rem 0.9rem;
		border-top: 1px solid var(--border);
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	kbd {
		font: inherit;
		color: var(--text-muted);
		padding: 0 0.3rem;
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.credit {
		margin-left: auto;
	}
</style>
