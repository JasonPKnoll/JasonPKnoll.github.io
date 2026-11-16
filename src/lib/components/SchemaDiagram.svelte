<script lang="ts">
	/**
	 * A database diagram built from real tables instead of an image.
	 *
	 * Layout: an optional banner table across the top (the one most others point
	 * at), then columns of tables. Wires run in lanes in the gaps between
	 * columns with right-angle turns, one lane per target table per gap, so
	 * keys pointing at the same table merge into one trunk. Wires to the banner
	 * go straight up into it. Ends use crow's foot notation: a fork on the
	 * foreign key (many) and a double bar on the table it points to (one).
	 *
	 * The diagram is laid out at a fixed width and scaled down as a whole on
	 * narrow screens. Picking a table shows its fields and relationships in a
	 * readable panel below.
	 */
	import { tick } from 'svelte';
	import { KeyRound, X } from '@lucide/svelte';
	import type { Schema, SchemaTable } from '#lib/projects.ts';

	let { schema }: { schema: Schema } = $props();

	/** Width the diagram is laid out at. Narrower screens scale it down. */
	const WIDTH = 980;
	const LANE_GAP = 10;
	const CORNER = 12;

	type Rel = { from: string; col: string; to: string };
	type Wire = Rel & { color: string; d: string; cone: string; marks: string };

	let viewport: HTMLDivElement | undefined = $state();
	let canvas: HTMLDivElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();
	let ready = $state(false);
	let scale = $state(1);
	let height = $state(0);
	let wires: Wire[] = $state([]);
	let hovered: string | null = $state(null);
	let selected: string | null = $state(null);
	const active = $derived(hovered ?? selected);

	const tableOf = (name: string) => schema.tables.find((t) => t.name === name);
	const colorOf = (name: string) => tableOf(name)?.color ?? 'mint';
	const singular = (name: string) => name.replace(/_/g, ' ').replace(/s$/, '');
	const plural = (name: string) => name.replace(/_/g, ' ') + (name.endsWith('s') ? '' : 's');

	const banner = $derived(schema.banner ? tableOf(schema.banner) : undefined);
	const columns = $derived(
		schema.columns.map((names) => names.map((n) => tableOf(n)).filter((t) => !!t))
	);
	const columnOf = $derived(
		new Map(schema.columns.flatMap((names, i) => names.map((n) => [n, i] as const)))
	);

	const relations: Rel[] = $derived(
		schema.tables.flatMap((t) =>
			t.columns.filter((c) => c.ref).map((c) => ({ from: t.name, col: c.name, to: c.ref! }))
		)
	);

	/** The active table plus every table it links to, in either direction. */
	const linked = $derived.by(() => {
		if (!active) return null;
		const set = new Set<string>([active]);
		for (const r of relations) {
			if (r.from === active) set.add(r.to);
			if (r.to === active) set.add(r.from);
		}
		return set;
	});

	const picked = $derived(selected ? tableOf(selected) : undefined);
	const pickedRelations = $derived(
		selected ? relations.filter((r) => r.from === selected || r.to === selected) : []
	);

	/**
	 * Decide which gap (gutter) each wire runs in. Gutter g sits left of column g,
	 * so column c has gutter c on its left and c + 1 on its right.
	 */
	function plan() {
		const gutterOf = new Map<Rel, number>();
		const lanesIn = (g: number) =>
			new Set(
				[...gutterOf].filter(([r, gg]) => gg === g && r.to !== schema.banner).map(([r]) => r.to)
			);

		const toTables = relations.filter((r) => r.to !== schema.banner);
		// Wires between neighbouring columns first, then same-column ones, which
		// reuse a lane to the same table when there is one.
		const order = [...toTables].sort(
			(a, b) =>
				Number(columnOf.get(a.from) === columnOf.get(a.to)) -
				Number(columnOf.get(b.from) === columnOf.get(b.to))
		);
		for (const r of order) {
			const c = columnOf.get(r.from)!;
			const p = columnOf.get(r.to)!;
			if (p < c) gutterOf.set(r, c);
			else if (p > c) gutterOf.set(r, c + 1);
			else gutterOf.set(r, lanesIn(c).has(r.to) ? c : c + 1);
		}

		// Wires up to the banner leave on the side away from a table's other wires.
		for (const r of relations.filter((r) => r.to === schema.banner)) {
			const c = columnOf.get(r.from)!;
			const sides = new Set(
				toTables.filter((o) => o.from === r.from).map((o) => (gutterOf.get(o) === c ? 'L' : 'R'))
			);
			let g: number;
			if (sides.size === 1) g = sides.has('L') ? c + 1 : c;
			else g = lanesIn(c + 1).size < lanesIn(c).size ? c + 1 : c;
			gutterOf.set(r, g);
		}
		return gutterOf;
	}

	/** Polyline with rounded corners. */
	function rounded(points: [number, number][]) {
		let d = `M${points[0][0]} ${points[0][1]}`;
		for (let i = 1; i < points.length - 1; i++) {
			const [px, py] = points[i - 1];
			const [x, y] = points[i];
			const [nx, ny] = points[i + 1];
			const d1 = Math.hypot(x - px, y - py);
			const d2 = Math.hypot(nx - x, ny - y);
			const r = Math.min(CORNER, d1 / 2, d2 / 2);
			if (r < 0.5) {
				d += ` L${x} ${y}`;
				continue;
			}
			const ax = x + ((px - x) / d1) * r;
			const ay = y + ((py - y) / d1) * r;
			const bx = x + ((nx - x) / d2) * r;
			const by = y + ((ny - y) / d2) * r;
			d += ` L${ax} ${ay} Q${x} ${y} ${bx} ${by}`;
		}
		const [lx, ly] = points[points.length - 1];
		return `${d} L${lx} ${ly}`;
	}

	function measure() {
		if (!viewport || !canvas) return;
		scale = Math.min(1, viewport.clientWidth / WIDTH);
		height = canvas.offsetHeight;
		layout();
	}

	function layout() {
		const root = canvas;
		if (!root) return;
		const box = root.getBoundingClientRect();
		// Undo any scaling so wires use the canvas's own coordinates.
		const k = box.width / root.offsetWidth || 1;
		const rect = (el: Element | null) => {
			const r = el!.getBoundingClientRect();
			return {
				l: (r.left - box.left) / k,
				r: (r.right - box.left) / k,
				b: (r.bottom - box.top) / k,
				y: ((r.top + r.bottom) / 2 - box.top) / k
			};
		};
		const card = (name: string) => rect(root.querySelector(`[data-table="${name}"]`));

		// Column edges, then the centre line of each gutter.
		const edges = schema.columns.map((names) => card(names[0]));
		const n = edges.length;
		const gutterMid = (g: number) =>
			g === 0 ? edges[0].l - 26 : g === n ? edges[n - 1].r + 26 : (edges[g - 1].r + edges[g].l) / 2;

		const gutterOf = plan();

		// One lane per target table in each gutter. Lanes whose wires mostly come
		// from the left sit on the left, and so on, to keep crossings down.
		const lanes = new Map<string, number>();
		for (let g = 0; g <= n; g++) {
			const inG = [...gutterOf].filter(([, gg]) => gg === g).map(([r]) => r);
			const targets = [...new Set(inG.map((r) => r.to))];
			const lean = (to: string) => {
				const sides = inG
					.filter((r) => r.to === to)
					.flatMap((r) => {
						const s = [columnOf.get(r.from)! >= g ? 1 : -1];
						if (to !== schema.banner) s.push(columnOf.get(to)! >= g ? 1 : -1);
						return s;
					});
				return sides.reduce((a, b) => a + b, 0) / sides.length;
			};
			targets.sort((a, b) => lean(a) - lean(b));
			targets.forEach((to, i) =>
				lanes.set(`${g}:${to}`, gutterMid(g) + (i - (targets.length - 1) / 2) * LANE_GAP)
			);
		}

		const top = banner ? card(banner.name) : null;

		wires = relations.map((rel) => {
			const { from, col, to } = rel;
			const g = gutterOf.get(rel)!;
			const lx = lanes.get(`${g}:${to}`)!;
			const a = card(from);
			const childRight = columnOf.get(from)! >= g; // child sits right of its gutter
			const x1 = childRight ? a.l : a.r;
			const n1 = childRight ? -1 : 1; // pointing out of the child, along the wire
			const y1 = rect(root.querySelector(`[data-table="${from}"] [data-col="${col}"]`)).y;

			// "Many" end: a rounded cone. Two prongs leave the line together, then
			// flare out onto the table edge, with a soft fill between them.
			const j = x1 + n1 * 14;
			const c = x1 + n1 * 5;
			const cone = `M${j} ${y1} Q${c} ${y1} ${x1} ${y1 - 6.5} L${x1} ${y1 + 6.5} Q${c} ${y1} ${j} ${y1}Z`;
			let marks = `M${j} ${y1} Q${c} ${y1} ${x1} ${y1 - 6.5} M${j} ${y1} Q${c} ${y1} ${x1} ${y1 + 6.5}`;
			let d: string;

			if (to === schema.banner && top) {
				const y2 = top.b;
				d = rounded([
					[x1, y1],
					[lx, y1],
					[lx, y2]
				]);
				// "One" end: a double bar right against the table.
				marks += ` M${lx - 5} ${y2 + 4} H${lx + 5} M${lx - 5} ${y2 + 8} H${lx + 5}`;
			} else {
				const b = card(to);
				const targetRight = columnOf.get(to)! >= g;
				const x2 = targetRight ? b.l : b.r;
				const n2 = targetRight ? -1 : 1;
				const y2 = rect(root.querySelector(`[data-table="${to}"] [data-pk]`)).y;
				d = rounded([
					[x1, y1],
					[lx, y1],
					[lx, y2],
					[x2, y2]
				]);
				marks += ` M${x2 + n2 * 4} ${y2 - 5} V${y2 + 5} M${x2 + n2 * 8} ${y2 - 5} V${y2 + 5}`;
			}
			return { ...rel, color: colorOf(to), d, cone, marks };
		});
	}

	$effect(() => {
		if (!viewport || !canvas) return;
		ready = true;
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		observer.observe(canvas);
		document.fonts?.ready.then(measure);
		return () => observer.disconnect();
	});

	async function pick(name: string) {
		selected = selected === name ? null : name;
		// On a scaled-down diagram the details matter most, so bring them into view.
		if (selected && scale < 0.8) {
			await tick();
			panel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}

	const touches = (w: Wire) => w.from === active || w.to === active;
	const onKey = (e: KeyboardEvent, name: string) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(name);
		}
	};
</script>

{#snippet oneToMany()}
	<svg class="glyph" viewBox="0 0 48 12" aria-hidden="true">
		<path d="M2 6H46M5 1V11M9 1V11M33 6Q41 6 46 0.5M33 6Q41 6 46 11.5" />
	</svg>
{/snippet}

{#snippet tableCard(t: SchemaTable, wide: boolean)}
	<div
		role="button"
		tabindex="0"
		aria-pressed={selected === t.name}
		aria-label="{t.name} table, show fields and relationships"
		data-table={t.name}
		class="card"
		class:wide
		class:dim={linked && !linked.has(t.name)}
		class:current={active === t.name}
		style:--c={t.color ? `var(--c-${t.color})` : null}
		onclick={() => pick(t.name)}
		onkeydown={(e) => onKey(e, t.name)}
		onpointerenter={(e) => e.pointerType === 'mouse' && (hovered = t.name)}
		onpointerleave={() => (hovered = null)}
	>
		<p class="title" class:colored={!!t.color}>{t.name}</p>
		<div class="rows">
			{#each t.columns as c (c.name)}
				<div
					class="row"
					data-col={c.name}
					data-pk={c.pk ? '' : undefined}
					class:fk={!!c.ref}
					style:--c={c.ref ? `var(--c-${colorOf(c.ref)})` : null}
				>
					<span class="fname">
						{#if c.pk}<KeyRound size={12} aria-label="Primary key" />{/if}
						{c.name}
					</span>
					<span class="ftype">
						{#if c.ref}<span class="ref"><span aria-hidden="true">→</span> {c.ref}</span>{:else}{c.type}{/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<figure class="schema" aria-label={schema.label}>
	<div
		class="viewport"
		class:ready
		bind:this={viewport}
		style:height={ready ? `${height * scale}px` : null}
	>
		<div
			class="canvas"
			class:has-active={!!active}
			style:width="{WIDTH}px"
			style:transform={ready && scale < 1 ? `scale(${scale})` : null}
			bind:this={canvas}
		>
			<svg class="wires" aria-hidden="true">
				{#each wires as w, i (i)}
					<g class="wire" style:--c="var(--c-{w.color})">
						<path d={w.d} />
						<path class="cone" d={w.cone} />
						<path d={w.marks} />
					</g>
				{/each}
				<!-- The active table's wires again, on top of everything else. -->
				{#each wires.filter(touches) as w, i (i)}
					<g class="wire on" style:--c="var(--c-{w.color})">
						<path class="line" d={w.d} />
						<path class="cone" d={w.cone} />
						<path d={w.marks} />
					</g>
				{/each}
			</svg>

			{#if banner}{@render tableCard(banner, true)}{/if}

			<div class="columns" style:--n={columns.length}>
				{#each columns as col, i (i)}
					<div class="stack">
						{#each col as t (t.name)}{@render tableCard(t, false)}{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="legend">
		<span class="key">{@render oneToMany()} one to many</span>
		<span class="key"><KeyRound size={12} aria-hidden="true" /> primary key</span>
		<span class="key"><span class="ref" style:--c="var(--c-mint)">→ table</span> foreign key</span>
	</div>

	<div class="panel" bind:this={panel} aria-live="polite">
		{#if picked}
			<div class="panel-head" style:--c={picked.color ? `var(--c-${picked.color})` : null}>
				<h4 class="mono">{picked.name}</h4>
				<button type="button" class="close" onclick={() => (selected = null)} aria-label="Close details">
					<X size={16} />
				</button>
			</div>

			<ul class="fields">
				{#each picked.columns as c (c.name)}
					<li class:fk={!!c.ref} style:--c={c.ref ? `var(--c-${colorOf(c.ref)})` : null}>
						<span class="mono">
							{#if c.pk}<KeyRound size={11} aria-label="Primary key" />{/if}
							{c.name}
						</span>
						<span class="mono type">{c.ref ? `→ ${c.ref}` : c.type}</span>
					</li>
				{/each}
			</ul>

			<p class="label mono">Relationships</p>
			<ul class="rels">
				{#each pickedRelations as r (r.from + r.col)}
					<li>
						<span class="pair mono">
							<span class="name" style:--c="var(--c-{colorOf(r.to)})">{r.to}</span>
							<span class="n">1</span>
							{@render oneToMany()}
							<span class="n">N</span>
							<span class="name" style:--c={tableOf(r.from)?.color ? `var(--c-${colorOf(r.from)})` : null}
								>{r.from}</span
							>
						</span>
						<span class="say">
							One {singular(r.to)} has many {plural(r.from)}
							<span class="mono via">{r.from}.{r.col}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="hint">
				<span class="touch">Tap</span><span class="mouse">Hover or click</span> a table to trace its
				relationships and see its fields up close.
			</p>
		{/if}
	</div>
</figure>

<style>
	.schema {
		--c-mint: var(--accent);
		--c-blue: var(--accent-2);
		--c-coral: #ff9c86;
		--c-pink: #f592cf;
		margin: 0.5rem 0 0;
		container-type: inline-size;
	}
	.viewport {
		/* Without JavaScript the diagram scrolls sideways instead of scaling. */
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 20px;
		background:
			radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.05) 1px, transparent 0) 0 0 / 22px 22px,
			var(--bg-raised);
	}
	.viewport.ready {
		overflow: hidden;
	}
	.canvas {
		position: relative;
		padding: 2rem 2.4rem 2.2rem;
		transform-origin: 0 0;
	}
	.columns {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: 54px;
		margin-top: 52px;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ---------- Wires ---------- */
	.wires {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}
	.wire path {
		fill: none;
		/* Solid colour, so wires sharing a lane merge cleanly into one trunk. */
		stroke: color-mix(in srgb, var(--c) 62%, var(--bg-raised));
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: opacity 0.25s;
	}
	.wire path.cone {
		fill: color-mix(in srgb, var(--c) 28%, transparent);
		stroke: none;
	}
	.has-active .wire:not(.on) path {
		opacity: 0.12;
	}
	.wire.on path {
		stroke: var(--c);
		stroke-width: 1.9;
	}
	.wire.on .line {
		stroke-dasharray: 5 4;
		animation: flow 0.9s linear infinite;
	}
	@keyframes flow {
		to {
			stroke-dashoffset: -9;
		}
	}

	/* ---------- Tables ---------- */
	.card {
		position: relative;
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		background: var(--bg-card);
		overflow: hidden;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		transition:
			opacity 0.25s,
			border-color 0.25s,
			box-shadow 0.25s;
	}
	.card.dim {
		opacity: 0.3;
	}
	.card.current,
	.card[aria-pressed='true'] {
		border-color: var(--c, var(--text-dim));
		box-shadow:
			0 0 0 1px var(--c, var(--text-dim)),
			0 10px 30px rgb(0 0 0 / 0.35);
	}
	.title {
		padding: 0.55rem 0.75rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text);
		background: rgb(255 255 255 / 0.03);
		border-bottom: 1px solid var(--border-strong);
	}
	.title.colored {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 10%, transparent);
		box-shadow: inset 0 2px 0 var(--c);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.34rem 0.65rem;
		white-space: nowrap;
	}
	.row + .row {
		border-top: 1px solid var(--border);
	}
	.fname {
		color: var(--text);
	}
	.fname :global(svg) {
		display: inline-block;
		vertical-align: -1px;
		margin-right: 0.2rem;
		color: var(--c, var(--text-muted));
	}
	.ftype {
		color: var(--text-dim);
	}
	.row.fk .fname {
		color: var(--c);
	}
	.row.fk {
		box-shadow: inset 2px 0 0 var(--c);
	}

	/* The banner lays its fields out side by side. */
	.card.wide .rows {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}
	.card.wide .row {
		border-top: 0;
		border-right: 1px solid var(--border);
	}
	.card.wide .row:nth-child(5n) {
		border-right: 0;
	}
	.card.wide .row:nth-child(n + 6) {
		border-top: 1px solid var(--border);
	}

	.ref {
		display: inline-block;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		color: var(--c);
		background: color-mix(in srgb, var(--c) 13%, transparent);
	}

	/* ---------- Legend ---------- */
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		margin-top: 0.9rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}
	.glyph {
		width: 34px;
		height: 10px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.legend .glyph {
		color: var(--text-muted);
	}

	/* ---------- Details panel ---------- */
	.panel {
		margin-top: 1rem;
		padding: 1rem 1.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-card);
		scroll-margin: calc(var(--nav-h) + 1rem) 0 1rem;
	}
	.hint {
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.touch {
		display: none;
	}
	@media (hover: none) {
		.touch {
			display: inline;
		}
		.mouse {
			display: none;
		}
	}
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.85rem;
	}
	.panel-head h4 {
		font-size: 0.95rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--c, var(--text));
	}
	.close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.close:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
	.panel ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* The diagram already shows fields at full size on wide screens. */
	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
		gap: 0 1.5rem;
		margin-bottom: 1rem !important;
		font-size: 0.8rem;
	}
	.fields li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--border);
	}
	.fields li.fk,
	.fields li.fk .type {
		color: var(--c);
	}
	.fields .type {
		color: var(--text-dim);
	}
	.fields :global(svg) {
		display: inline-block;
		vertical-align: -1px;
		margin-right: 0.2rem;
	}
	@container (min-width: 700px) {
		.fields {
			display: none;
		}
	}
	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		margin-bottom: 0.5rem;
	}
	.rels {
		display: grid;
		gap: 0.75rem;
	}
	.rels li {
		display: grid;
		gap: 0.2rem;
	}
	.pair {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
	}
	.pair .name {
		color: var(--c, var(--text));
		font-weight: 600;
	}
	.pair .n {
		color: var(--text-dim);
	}
	.pair .glyph {
		color: var(--text-muted);
	}
	.say {
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.via {
		margin-left: 0.35rem;
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	@media (prefers-reduced-motion: reduce) {
		.wire.on .line {
			animation: none;
		}
	}
</style>
