/**
 * A tiny pretend shell for the hero terminal. It knows a small file tree made
 * from the site's own content, and a handful of commands. Running a command
 * returns lines to print and, sometimes, somewhere to go (a project page, a
 * section, a download, an outside link). The component does the navigating.
 */
import { projects } from '#lib/projects.ts';
import { site } from '#lib/site.ts';

export type Tone = 'muted' | 'dim' | 'accent' | 'blue' | 'coral';
/** A run of text. With `run`, it prints as a button that runs that command. */
export type Seg = { t: string; tone?: Tone; run?: string };
export type Line = Seg[];

export type Action =
	| { kind: 'project'; slug: string }
	| { kind: 'page'; path: '/projects' | '/resume' }
	| { kind: 'section'; id: 'about' | 'work' | 'contact' }
	| { kind: 'file'; href: string }
	| { kind: 'external'; href: string };

export type Result = { lines: Line[]; action?: Action; clear?: boolean; cwd?: string[] };

type File = { type: 'file'; body: () => Line[]; action?: Action };
/** `browse` dirs are entered with cd; other dirs with an action take you to that page. */
type Dir = { type: 'dir'; children: Record<string, Node>; action?: Action; browse?: boolean };
type Node = File | Dir;

const p = (t: string, tone?: Tone): Line => [{ t, tone }];
const blank: Line = [{ t: '' }];

const root: Dir = {
	type: 'dir',
	children: {
		projects: {
			type: 'dir',
			browse: true,
			action: { kind: 'page', path: '/projects' },
			children: Object.fromEntries(
				projects.map((project) => [
					project.slug,
					{
						type: 'dir',
						action: { kind: 'project', slug: project.slug },
						children: {
							'README.md': {
								type: 'file',
								action: { kind: 'project', slug: project.slug },
								body: () => [
									[{ t: `# ${project.name}`, tone: 'accent' }],
									p(project.kicker, 'dim'),
									blank,
									p(project.summary),
									blank,
									p(project.tech.join(' · '), 'muted')
								]
							}
						}
					} satisfies Dir
				])
			)
		},
		resume: {
			type: 'dir',
			action: { kind: 'page', path: '/resume' },
			children: {
				'resume.pdf': {
					type: 'file',
					action: { kind: 'file', href: '/resume.pdf' },
					body: () => [p('binary file. try: open resume/resume.pdf', 'muted')]
				},
				'resume.md': {
					type: 'file',
					action: { kind: 'file', href: '/resume.md' },
					body: () => [p('Plain text resume. Run open resume/resume.md to download it.', 'muted')]
				}
			}
		},
		'about.txt': {
			type: 'file',
			action: { kind: 'section', id: 'about' },
			body: () => [p(site.intro), blank, p(site.about[1], 'muted')]
		},
		'skills.txt': {
			type: 'file',
			action: { kind: 'section', id: 'about' },
			body: () =>
				Object.entries(site.stack).flatMap(([group, items]) => [
					[{ t: group, tone: 'accent' }],
					p(`  ${items.join(', ')}`, 'muted')
				])
		},
		'contact.txt': {
			type: 'file',
			action: { kind: 'section', id: 'contact' },
			body: () => [
				[{ t: 'email     ', tone: 'dim' }, { t: site.email, run: 'open email' }],
				...site.socials.map((s): Line => [
					{ t: s.name.padEnd(10), tone: 'dim' },
					{ t: s.handle, run: `open ${s.name}` }
				])
			]
		}
	}
};

/** Outside places `open` knows by name. */
const links: Record<string, string> = {
	email: `mailto:${site.email}`,
	mail: `mailto:${site.email}`,
	...Object.fromEntries(site.socials.map((s) => [s.name, s.href])),
	twitter: site.socials.find((s) => s.name === 'x')?.href ?? ''
};

const commands = [
	'help',
	'ls',
	'cd',
	'cat',
	'open',
	'pwd',
	'whoami',
	'neofetch',
	'echo',
	'history',
	'date',
	'clear'
] as const;

export const prompt = (cwd: string[]) => (cwd.length ? `~/${cwd.join('/')}` : '~');

/** Turns a typed path into a list of names from the root, or null if it climbs out. */
function normalize(path: string, cwd: string[]): string[] {
	const parts = path.startsWith('/') || path.startsWith('~') ? [] : [...cwd];
	for (const seg of path.replace(/^~\/?/, '').split('/')) {
		if (!seg || seg === '.') continue;
		if (seg === '..') parts.pop();
		else parts.push(seg);
	}
	return parts;
}

function walk(parts: string[]): Node | undefined {
	let node: Node = root;
	for (const name of parts) {
		if (node.type !== 'dir') return undefined;
		node = node.children[name];
		if (!node) return undefined;
	}
	return node;
}

/**
 * Finds a path, falling back to a project slug from anywhere, so
 * `cd fido-bot` works without `cd projects` first.
 */
function find(path: string, cwd: string[]): { node: Node; parts: string[] } | undefined {
	const parts = normalize(path, cwd);
	const node = walk(parts);
	if (node) return { node, parts };
	const rest = normalize(path, []);
	const inProjects = walk(['projects', ...rest]);
	if (inProjects) return { node: inProjects, parts: ['projects', ...rest] };
}

const listing = (dir: Dir, parts: string[]): Line => {
	const entries = Object.entries(dir.children);
	const line: Line = [];
	entries.forEach(([name, node], i) => {
		const path = [...parts, name].join('/');
		line.push(
			node.type === 'dir'
				? { t: `${name}/`, tone: 'blue', run: `cd ~/${path}` }
				: { t: name, run: `cat ~/${path}` }
		);
		if (i < entries.length - 1) line.push({ t: '  ' });
	});
	return line;
};

const help = (): Line[] => {
	const row = (cmd: string, args: string, what: string): Line => [
		{ t: cmd, tone: 'accent', run: cmd },
		{ t: ` ${args}`.padEnd(13 - cmd.length), tone: 'dim' },
		{ t: what, tone: 'muted' }
	];
	return [
		row('ls', '[dir]', 'list files'),
		row('cd', '<dir>', 'go to a project or page'),
		row('cat', '<file>', 'print a file'),
		row('open', '<name>', 'open a page, file, or link'),
		[
			{ t: 'also  ', tone: 'dim' },
			...['whoami', 'neofetch', 'history', 'clear'].flatMap((c, i, all): Seg[] => [
				{ t: c, tone: 'accent', run: c },
				...(i < all.length - 1 ? [{ t: ' · ', tone: 'dim' as const }] : [])
			])
		],
		[{ t: 'try   ', tone: 'dim' }, { t: 'cd fido-bot', tone: 'accent', run: 'cd fido-bot' }]
	];
};

const neofetch = (): Line[] => {
	const row = (k: string, v: string): Line => [
		{ t: `${k.padEnd(9)}`, tone: 'accent' },
		{ t: v }
	];
	return [
		[{ t: 'jk', tone: 'accent' }, { t: '@', tone: 'dim' }, { t: 'portfolio', tone: 'blue' }],
		p('------------', 'dim'),
		row('os', 'Portfolio OS (SvelteKit)'),
		row('role', site.role),
		row('base', 'Denver, CO'),
		row('focus', 'web apps · bots · VR · 3D'),
		row('projects', String(projects.length)),
		row('shell', 'jksh 1.0'),
		[
			{ t: '███', tone: 'accent' },
			{ t: '███', tone: 'blue' },
			{ t: '███', tone: 'coral' },
			{ t: '███', tone: 'muted' }
		]
	];
};

export type State = { cwd: string[]; history: string[] };

export function run(input: string, state: State): Result {
	const [cmd = '', ...args] = input.trim().split(/\s+/);
	const arg = args.filter((a) => !a.startsWith('-'))[0];
	const err = (msg: string): Result => ({ lines: [p(msg, 'coral')] });

	switch (cmd) {
		case '':
			return { lines: [] };
		case 'help':
		case '?':
		case 'man':
			return { lines: help() };
		case 'ls':
		case 'dir': {
			const hit = arg ? find(arg, state.cwd) : { node: walk(state.cwd)!, parts: state.cwd };
			if (!hit) return err(`ls: ${arg}: No such file or directory`);
			if (hit.node.type === 'file') return { lines: [p(arg!)] };
			return { lines: [listing(hit.node, hit.parts)] };
		}
		case 'cd': {
			if (!arg || arg === '~' || arg === '/') return { lines: [], cwd: [] };
			const hit = find(arg, state.cwd);
			if (!hit) return err(`cd: no such file or directory: ${arg}`);
			if (hit.node.type === 'file') return err(`cd: not a directory: ${arg}`);
			// Directories that are pages on the site take you there.
			const { action, browse } = hit.node;
			if (action && !browse) return { lines: [opening(action)], action };
			return { lines: [], cwd: hit.parts };
		}
		case 'cat':
		case 'less':
		case 'more': {
			if (!arg) return err(`${cmd}: missing file name`);
			const hit = find(arg, state.cwd);
			if (!hit) return err(`${cmd}: ${arg}: No such file or directory`);
			if (hit.node.type === 'dir') {
				const readme = hit.node.children['README.md'];
				if (readme?.type === 'file') return { lines: readme.body() };
				return err(`${cmd}: ${arg}: Is a directory`);
			}
			return { lines: hit.node.body() };
		}
		case 'open':
		case 'xdg-open':
		case 'start': {
			if (!arg) return err('open: what should I open? try: open github');
			const href = links[arg.toLowerCase()];
			if (href) {
				const action: Action = { kind: 'external', href };
				return { lines: [opening(action)], action };
			}
			const hit = find(arg, state.cwd);
			if (!hit) return err(`open: ${arg}: No such file or directory`);
			const action = hit.node.action;
			if (!action) return err(`open: nothing to open for ${arg}`);
			return { lines: [opening(action)], action };
		}
		case 'pwd':
			return { lines: [p(`/home/jk${state.cwd.length ? '/' + state.cwd.join('/') : ''}`)] };
		case 'whoami':
			return { lines: [p(`${site.name.toLowerCase().replace(' ', '-')}, ${site.role.toLowerCase()}`, 'accent')] };
		case 'neofetch':
		case 'fastfetch':
			return { lines: neofetch() };
		case 'echo':
			return { lines: [p(args.join(' '))] };
		case 'history':
			return {
				lines: state.history.map((h, i) => [
					{ t: `${String(i + 1).padStart(3)}  `, tone: 'dim' },
					{ t: h, run: h }
				])
			};
		case 'date':
			return { lines: [p(new Date().toString().replace(/ \(.*\)$/, ''))] };
		case 'clear':
		case 'cls':
			return { lines: [], clear: true };

		// A few easter eggs.
		case 'sudo':
			return { lines: [p('jk is not in the sudoers file. This incident will be reported.', 'coral')] };
		case 'rm':
			return { lines: [p('rm: permission denied. Nice try though.', 'coral')] };
		case 'exit':
		case 'logout':
			return { lines: [p('There is no escape. Try cd projects instead.', 'muted')] };
		case 'vim':
		case 'vi':
		case 'nano':
		case 'emacs':
			return { lines: [p(`${cmd}: you might never get out. Try cat instead.`, 'muted')] };
		case 'hello':
		case 'hi':
		case 'hey':
			return { lines: [p('Hey! Run help to look around, or open email to say hi for real.', 'accent')] };
		case 'git':
			return {
				lines: [
					args[0] === 'log'
						? p('Every commit is on GitHub. Run open github.', 'muted')
						: p('git: this repo is read only here. Run open github.', 'muted')
				]
			};
		case 'ping':
			return { lines: [p(`64 bytes from ${arg ?? 'jpknoll.com'}: time=0.42 ms`, 'muted')] };
		case 'coffee':
		case 'brew':
			return { lines: [p('Brewing... ☕ ready. Back to work.', 'muted')] };
		default:
			return err(`command not found: ${cmd}. Try help.`);
	}
}

function opening(action: Action): Line {
	const to =
		action.kind === 'project'
			? `/projects/${action.slug}`
			: action.kind === 'page'
				? action.path
				: action.kind === 'section'
					? `#${action.id}`
					: action.kind === 'file'
						? action.href.slice(1)
						: action.href.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '');
	const verb = action.kind === 'file' ? 'downloading' : 'opening';
	return [
		{ t: '→ ', tone: 'accent' },
		{ t: `${verb} `, tone: 'muted' },
		{ t: to, tone: 'blue' }
	];
}

/**
 * Tab completion. Returns the new input, and the options to print when
 * there is more than one.
 */
export function complete(input: string, cwd: string[]): { input: string; options: string[] } {
	const words = input.split(' ');
	const last = words.at(-1) ?? '';
	let options: string[];
	let base = '';
	if (words.length === 1) {
		options = commands.filter((c) => c.startsWith(last));
	} else if (words[0] === 'open' && !last.includes('/')) {
		const here = (walk(cwd) as Dir).children;
		options = [...Object.keys(links).filter((l) => l !== 'mail' && l !== 'twitter'), ...names(here)].filter((n) =>
			n.startsWith(last)
		);
	} else {
		const slash = last.lastIndexOf('/');
		base = slash >= 0 ? last.slice(0, slash + 1) : '';
		const dirPath = base ? find(base, cwd) : { node: walk(cwd)!, parts: cwd };
		let pool: string[] = dirPath?.node.type === 'dir' ? names(dirPath.node.children) : [];
		// Projects complete from anywhere, matching how cd finds them.
		if (!base && words[0] === 'cd') pool = [...new Set([...pool, ...names((root.children.projects as Dir).children)])];
		options = pool.filter((n) => n.startsWith(last.slice(base.length)));
	}
	if (!options.length) return { input, options: [] };
	const prefix = options.reduce((a, b) => {
		let i = 0;
		while (i < a.length && a[i] === b[i]) i++;
		return a.slice(0, i);
	});
	const done = options.length === 1;
	const word = base + prefix + (done && !prefix.endsWith('/') ? (words.length === 1 ? ' ' : '') : '');
	words[words.length - 1] = word;
	return { input: words.join(' '), options: done ? [] : options };
}

const names = (children: Record<string, Node>) =>
	Object.entries(children).map(([n, node]) => (node.type === 'dir' ? `${n}/` : n));
