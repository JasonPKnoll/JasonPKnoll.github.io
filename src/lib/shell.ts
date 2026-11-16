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
	| { kind: 'external'; href: string }
	| { kind: 'doom' };

export type Result = { lines: Line[]; action?: Action; clear?: boolean; cwd?: string[] };

/** An `exec` file runs its action when called by path, like ./doom.exe. */
type File = { type: 'file'; body: () => Line[]; action?: Action; exec?: boolean };
/** `browse` dirs are entered with cd; other dirs with an action take you to that page. */
type Dir = {
	type: 'dir';
	children: Record<string, Node>;
	action?: Action;
	browse?: boolean;
	/** Shows up in listings but can't be entered. */
	locked?: boolean;
};
type Node = File | Dir;

const p = (t: string, tone?: Tone): Line => [{ t, tone }];
const blank: Line = [{ t: '' }];

/** The home folder, /home/jk, where the shell starts. */
const home: Dir = {
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

const file = (...lines: string[]): File => ({ type: 'file', body: () => lines.map((l) => p(l)) });

/** The whole machine. Home is the only interesting part, the rest is set dressing. */
const root: Dir = {
	type: 'dir',
	children: {
		bin: {
			type: 'dir',
			children: {} // filled in below, once the command list exists
		},
		etc: {
			type: 'dir',
			children: {
				hostname: file('portfolio'),
				motd: file(
					'Welcome to jpknoll.com.',
					'Everything here is real, from the projects to the resume.',
					'Run help to see what you can do.'
				),
				'os-release': file('NAME="Portfolio OS"', 'VERSION="1.0"', 'BUILT_WITH="SvelteKit"', 'HOME_URL="https://www.jpknoll.com"')
			}
		},
		home: { type: 'dir', children: { jk: home } },
		root: { type: 'dir', locked: true, children: {} },
		tmp: {
			type: 'dir',
			children: {
				'note.txt': file(
					'Note to self: the good stuff is in /usr/games.',
					"Don't cat it. Run it."
				)
			}
		},
		usr: {
			type: 'dir',
			children: {
				games: {
					type: 'dir',
					children: {
						'doom.exe': {
							type: 'file',
							exec: true,
							action: { kind: 'doom' },
							body: () => [p('MZ ¸ÿÿ@º´Í!¸LÍ! This program cannot be catted. Try running it.', 'dim')]
						}
					}
				}
			}
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

(root.children.bin as Dir).children = Object.fromEntries(
	commands.map((c) => [c, { type: 'file', body: () => [p(`${c}: binary file. Just type ${c} to run it.`, 'muted')] }])
);

export const HOME = ['home', 'jk'];

const inHome = (parts: string[]) => HOME.every((name, i) => parts[i] === name);

/** How a path is shown: under home it starts with ~, anywhere else it is absolute. */
export const prompt = (parts: string[]) =>
	inHome(parts) ? ['~', ...parts.slice(HOME.length)].join('/') : `/${parts.join('/')}`;

/** Turns a typed path into a list of names from the filesystem root. */
function normalize(path: string, cwd: string[]): string[] {
	const parts = path.startsWith('/') ? [] : path.startsWith('~') ? [...HOME] : [...cwd];
	for (const seg of path.replace(/^~/, '').split('/')) {
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
	if (path.startsWith('/') || path.startsWith('~')) return;
	const rest = normalize(path, [...HOME, 'projects']);
	const inProjects = walk(rest);
	if (inProjects) return { node: inProjects, parts: rest };
}

const listing = (dir: Dir, parts: string[]): Line => {
	const entries = Object.entries(dir.children);
	const line: Line = [];
	entries.forEach(([name, node], i) => {
		const path = prompt([...parts, name]);
		line.push(
			node.type === 'dir'
				? { t: `${name}/`, tone: node.locked ? 'dim' : 'blue', run: node.locked ? undefined : `cd ${path}` }
				: node.exec
					? { t: `${name}*`, tone: 'accent', run: path }
					: { t: name, run: `cat ${path}` }
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

	// Running a file by its path, like ./doom.exe or /usr/games/doom.exe.
	if (cmd.includes('/')) {
		const hit = find(cmd, state.cwd);
		if (!hit) return err(`${cmd}: No such file or directory`);
		if (hit.node.type === 'dir') return err(`${cmd}: Is a directory`);
		if (!hit.node.exec || !hit.node.action) return err(`${cmd}: Permission denied`);
		return launch(hit.node.action);
	}

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
			if (hit.node.locked) return err(`ls: ${arg}: Permission denied`);
			if (!Object.keys(hit.node.children).length) return { lines: [] };
			return { lines: [listing(hit.node, hit.parts)] };
		}
		case 'cd': {
			if (!arg) return { lines: [], cwd: HOME };
			const hit = find(arg, state.cwd);
			if (!hit) return err(`cd: no such file or directory: ${arg}`);
			if (hit.node.type === 'file') return err(`cd: not a directory: ${arg}`);
			if (hit.node.locked) return err(`cd: permission denied: ${arg}`);
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
			if (hit.node.type === 'file' && hit.node.exec) return launch(action);
			return { lines: [opening(action)], action };
		}
		case 'pwd':
			return { lines: [p(`/${state.cwd.join('/')}`)] };
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
		default: {
			const here = walk(state.cwd);
			const local = here?.type === 'dir' ? here.children[cmd] : undefined;
			if (local?.type === 'file' && local.exec) return err(`command not found: ${cmd}. Did you mean ./${cmd}?`);
			return err(`command not found: ${cmd}. Try help.`);
		}
	}
}

function launch(action: Action): Result {
	if (action.kind !== 'doom') return { lines: [opening(action)], action };
	return {
		lines: [
			p('DOOM shareware, id Software, 1993', 'coral'),
			p('Loading from the Internet Archive...', 'muted')
		],
		action
	};
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
						: action.kind === 'doom'
							? 'doom.exe'
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
	if (words.length === 1 && !last.includes('/')) {
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
		if (!base && words[0] === 'cd') pool = [...new Set([...pool, ...names((home.children.projects as Dir).children)])];
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
