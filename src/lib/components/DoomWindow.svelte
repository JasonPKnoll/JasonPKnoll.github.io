<!--
	doom.exe from the hero terminal. Runs the official DOOM v1.9 shareware
	release (static/games/doom/doom19s.zip, kept unmodified as the shareware
	terms require) in js-dos, a DOSBox build for the browser. Nothing loads
	until someone finds and runs doom.exe.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { onexit }: { onexit: () => void } = $props();

	/** Pinned js-dos release, checked with subresource integrity. */
	const JSDOS = 'https://cdn.jsdelivr.net/npm/js-dos@8.5.3/dist/';
	const SRI = {
		js: 'sha384-tpCX90eRzpJLpH4PcI+3QbJ04KXaHYTPTZWQ5klhoRPDf5n/ZCsrjLAqphsCl/zq',
		css: 'sha384-tYrgAxbRPufJUrIUwrHMumsQ0yWXdNaYMGKazEkzSgtkpSAps5dIS71lqDFtoVNF'
	};
	const ZIP = '/games/doom/doom19s.zip';

	/** Sound Blaster 16 at the DOSBox defaults, so DOOM has sound and music. */
	const DOSBOX_CONF = `
[sdl]
autolock=false
[dosbox]
memsize=16
[cpu]
core=auto
cputype=auto
cycles=max
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
oplmode=auto
[autoexec]
mount c .
c:
DOOM.EXE
`;
	const DEFAULT_CFG = [
		'snd_musicdevice 3',
		'snd_sfxdevice 3',
		'snd_sbport 544',
		'snd_sbirq 7',
		'snd_sbdma 1',
		'snd_channels 8',
		'sfx_volume 8',
		'music_volume 6',
		'usemouse 0',
		'screenblocks 10'
	].join('\r\n');

	type Step = { text: string; state: 'run' | 'ok' | 'fail' };
	let steps = $state<Step[]>([]);
	let ready = $state(false);
	let failed = $state(false);

	let dialog: HTMLDialogElement;
	let screen: HTMLDivElement;
	let player: { stop: () => Promise<void> } | undefined;
	let closing = false;

	async function step<T>(text: string, work: () => Promise<T>): Promise<T> {
		steps.push({ text, state: 'run' });
		const i = steps.length - 1;
		try {
			const result = await work();
			steps[i].state = 'ok';
			return result;
		} catch (e) {
			steps[i].state = 'fail';
			throw e;
		}
	}

	function load(tag: 'script' | 'link', url: string, integrity: string) {
		return new Promise<void>((resolve, reject) => {
			const el = document.createElement(tag);
			if (el instanceof HTMLScriptElement) el.src = url;
			else if (el instanceof HTMLLinkElement) {
				el.rel = 'stylesheet';
				el.href = url;
			}
			el.integrity = integrity;
			el.crossOrigin = 'anonymous';
			el.dataset.jsdos = '';
			el.onload = () => resolve();
			el.onerror = () => reject(new Error(`could not load ${url}`));
			document.head.append(el);
		});
	}

	onMount(() => {
		dialog.showModal();
		boot().catch(() => (failed = true));
		return () => {
			player?.stop().catch(() => {});
		};
	});

	async function boot() {
		const win = window as unknown as { Dos?: DosFn };
		await step('loading DOSBox (js-dos 8.5.3)', async () => {
			if (win.Dos) return;
			await Promise.all([load('link', JSDOS + 'js-dos.css', SRI.css), load('script', JSDOS + 'js-dos.js', SRI.js)]);
		});
		const zip = await step('fetching doom19s.zip, 2.4 MB', async () => {
			const res = await fetch(ZIP);
			if (!res.ok) throw new Error(String(res.status));
			return new Uint8Array(await res.arrayBuffer());
		});
		const files = await step('unpacking DOOM.EXE and DOOM1.WAD', async () => {
			const { unzipSync } = await import('fflate');
			const all = unzipSync(zip, { filter: (f) => f.name === 'DOOM.EXE' || f.name === 'DOOM1.WAD' });
			return [
				...Object.entries(all).map(([path, contents]) => ({ path, contents })),
				{ path: 'DEFAULT.CFG', contents: new TextEncoder().encode(DEFAULT_CFG) }
			];
		});
		if (closing) return;
		steps.push({ text: 'C:\\> DOOM.EXE', state: 'run' });
		player = win.Dos!(screen, {
			dosboxConf: DOSBOX_CONF,
			initFs: files,
			pathPrefix: JSDOS + 'emulators/',
			kiosk: true,
			autoStart: true,
			theme: 'dark',
			renderAspect: '4/3',
			imageRendering: 'pixelated',
			quickSave: false,
			autoSave: false,
			mouseCapture: false,
			onEvent: (event: string) => {
				if (event === 'ci-ready') {
					steps[steps.length - 1].state = 'ok';
					// Let DOOM draw its first frames before the log fades out.
					setTimeout(() => (ready = true), 900);
					screen.querySelector('canvas')?.focus();
				}
			}
		});
	}

	type DosFn = (el: HTMLElement, options: Record<string, unknown>) => { stop: () => Promise<void> };

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
			<span></span><span></span><span></span>
			<p class="mono">doom.exe</p>
			<button type="button" class="close mono" onclick={quit} aria-label="Quit DOOM">quit ✕</button>
		</div>
		<div class="stage">
			<div class="screen" bind:this={screen}></div>
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
	.bar span {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--border-strong);
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
