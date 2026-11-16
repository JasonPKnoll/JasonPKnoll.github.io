import type { AssetPath } from '$app/types';
import type { Picture } from 'vite-imagetools';
import koiCover from '#lib/assets/KoiFish.png?enhanced';
import discordCover from '#lib/assets/DiscordBot.png?enhanced';
import helpCover from '#lib/assets/HelpNetwork.png?enhanced';
import watchCover from '#lib/assets/WatchMovies.jpeg?enhanced';
import weatherCover from '#lib/assets/seasonal.jpeg?enhanced';

export type Media = {
	kind: 'video' | 'image';
	/** Path relative to /static. Videos also have a sibling .jpg poster. */
	src: AssetPath;
	alt: string;
	width: number;
	height: number;
};

export type Table = {
	columns: string[];
	rows: string[][];
};

export type SchemaColor = 'mint' | 'blue' | 'coral' | 'pink';

export type SchemaColumn = {
	name: string;
	type: string;
	pk?: boolean;
	/** Foreign key: the name of the table it points to. */
	ref?: string;
};

export type SchemaTable = {
	name: string;
	/** Only tables other tables point at need a color; their foreign keys use it. */
	color?: SchemaColor;
	columns: SchemaColumn[];
};

/** A database diagram, drawn on the page instead of shown as an image. */
export type Schema = {
	label: string;
	/** CSS grid-template-areas rows (three columns), using table names. */
	areas: string[];
	tables: SchemaTable[];
};

export type Section = {
	title: string;
	body?: string[];
	media?: Media[];
	table?: Table;
	schema?: Schema;
};

export type Group = {
	title: string;
	intro?: string;
	sections: Section[];
};

export type Project = {
	slug: string;
	name: string;
	kicker: string;
	category: 'personal' | 'turing';
	status?: string;
	summary: string;
	description: string;
	highlight?: string;
	cover: Picture;
	/** Show the whole cover (letterboxed on this color) instead of cropping it. */
	coverContain?: string;
	coverAlt: string;
	tech: string[];
	links: { label: string; href: string }[];
	groups: Group[];
};

const video = (src: AssetPath, alt: string, width: number, height: number): Media => ({
	kind: 'video',
	src,
	alt,
	width,
	height
});
const image = (src: AssetPath, alt: string, width: number, height: number): Media => ({
	kind: 'image',
	src,
	alt,
	width,
	height
});

const pk: SchemaColumn = { name: 'id', type: 'integer', pk: true };
const timestamps: SchemaColumn = { name: 'timestamps', type: 'datetime' };
const fk = (name: string, ref: string): SchemaColumn => ({ name, type: 'foreign key', ref });
const col = (name: string, type: string): SchemaColumn => ({ name, type });

const helpNetworkSchema: Schema = {
	label: 'Entity relationship diagram of the HeLP Network database',
	areas: [
		'connections question_flags question_votes',
		'users posts tagging',
		'users responses tag',
		'response_flags response_votes .'
	],
	tables: [
		{
			name: 'users',
			color: 'mint',
			columns: [
				pk,
				col('username', 'string'),
				col('password', 'string'),
				col('email', 'string'),
				col('title', 'string'),
				col('is_active', 'boolean'),
				col('is_staff', 'boolean'),
				col('is_admin', 'boolean'),
				col('is_superuser', 'boolean'),
				timestamps
			]
		},
		{
			name: 'connections',
			columns: [pk, fk('user_sent', 'users'), fk('user_received', 'users'), col('status', 'enum'), timestamps]
		},
		{
			name: 'posts',
			color: 'blue',
			columns: [pk, fk('user', 'users'), col('title', 'string'), col('body', 'string'), col('quarantine', 'boolean'), timestamps]
		},
		{
			name: 'question_flags',
			columns: [pk, fk('user', 'users'), fk('post', 'posts'), col('comment', 'string'), col('status', 'enum'), timestamps]
		},
		{
			name: 'question_votes',
			columns: [pk, fk('user', 'users'), fk('post', 'posts'), col('vote_type', 'enum'), timestamps]
		},
		{ name: 'tagging', columns: [pk, fk('post', 'posts'), fk('tag', 'tag')] },
		{ name: 'tag', color: 'pink', columns: [pk, col('name', 'string'), timestamps] },
		{
			name: 'responses',
			color: 'coral',
			columns: [pk, fk('post', 'posts'), fk('user', 'users'), col('body', 'string'), col('quarantine', 'boolean'), timestamps]
		},
		{
			name: 'response_votes',
			columns: [pk, fk('user', 'users'), fk('response', 'responses'), col('vote_type', 'enum'), timestamps]
		},
		{
			name: 'response_flags',
			columns: [pk, fk('user', 'users'), fk('response', 'responses'), col('comment', 'string'), col('status', 'enum'), timestamps]
		}
	]
};

export const projects: Project[] = [
	{
		slug: 'koi-pond',
		name: 'VR Koi Pond',
		kicker: 'Unity · Virtual Reality',
		category: 'personal',
		status: 'Work in progress',
		summary:
			'A koi fish pond built in Unity for a virtual environment. Koi detect and avoid walls, seek out food, and reproduce. Offspring inherit the colors of their parents.',
		description:
			'Koi fish pond built in Unity for a Virtual Environment. Koi fish responsively detect and avoid walls, seek out food, and reproduce. Koi fish offspring inherit the colors of their parents.',
		cover: koiCover,
		coverAlt: 'Illustration of two koi fish swimming among cherry blossoms',
		tech: ['Unity', 'C#', 'VR', 'Amplify Shader Editor'],
		links: [{ label: 'GitHub repository', href: 'https://github.com/JasonPKnoll/koi_pond' }],
		groups: [
			{
				title: 'Behavior',
				sections: [
					{
						title: 'Event triggers',
						body: [
							'The koi fish have gravity applied upon leaving the water, and taken off when entering back into the water.'
						],
						media: [video('images/koi_pond/koi_yeet.mp4', 'A koi being thrown out of the pond and falling back in', 792, 386)]
					},
					{
						title: 'Swimming',
						body: ['The koi fish will reorient themselves to face upright when being put back into water.'],
						media: [video('images/koi_pond/koi_repo.mp4', 'A koi reorienting itself upright after being placed in the water', 792, 386)]
					},
					{
						title: 'Wall avoidance',
						body: [
							'The koi will avoid running into walls. This will be expanded upon in the future to give them multiple actions they can take upon first detecting a wall. For now they will just turn away from it.'
						],
						media: [video('images/koi_pond/koi_avoid.mp4', 'Koi turning away as they approach the pond wall', 792, 386)]
					}
				]
			},
			{
				title: 'Interaction',
				sections: [
					{
						title: 'Food',
						body: [
							'Spawn in food that can be given to the fish. Food gains gravity when dropped, and has a simple function to float when thrown into the water.'
						],
						media: [video('images/koi_pond/koi_food.mp4', 'Spawning fish food and dropping it into the pond', 792, 386)]
					},
					{
						title: 'Feeding & growth',
						body: [
							'Feed the koi and watch them grow. Koi will grow to a max size, which will then allow them to have offspring.'
						],
						media: [video('images/koi_pond/koi_feed.mp4', 'Koi eating food and growing larger', 792, 386)]
					},
					{
						title: 'Swap koi',
						body: [
							"Don't like the colors of one of the koi fish? Swap them out for a new koi with randomly generated colors."
						],
						media: [video('images/koi_pond/koi_swap.mp4', 'Swapping a koi for a new one with random colors', 792, 386)]
					},
					{
						title: 'Cook koi',
						body: [
							'Feeling a bit more destructive? Throw the koi into the "fire" and cook them. The spawned in cooked koi will be the same size as the fresh koi was.'
						],
						media: [video('images/koi_pond/koi_cook.mp4', 'Tossing a koi into a fire and spawning a cooked koi', 792, 386)]
					}
				]
			},
			{
				title: 'Shader',
				intro:
					'The shader is very early on and still a big work in progress, much like everything else. It was built using a node-based shader creation tool called Amplify. The main goals are to give the fish two distinct colors and a pattern that can be altered via property blocks in the C# code, and to give the koi the appearance of wiggling in the water.',
				sections: [
					{
						title: 'Two-tone pattern',
						body: [
							'Gives the koi a pattern with two distinct colors. Still need to find an alternative to the noise generator, as it is an unoptimized solution to creating a pattern.'
						],
						media: [image('images/koi_pond/shader_texture.png', 'Amplify node graph for the two-tone koi texture', 807, 436)]
					},
					{
						title: 'Sine-wave wiggle',
						body: ['Manipulates the vertices on the koi based on a sine equation.'],
						media: [image('images/koi_pond/shader_movement.png', 'Amplify node graph offsetting vertices with a sine wave', 814, 343)]
					},
					{
						title: 'World-space movement',
						body: ["Manipulates the vertices on the koi based on the koi's position in the world."],
						media: [image('images/koi_pond/shader_movement_2.png', 'Amplify node graph offsetting vertices by world position', 911, 482)]
					},
					{
						title: 'Result',
						body: ['The end result of the shader so far.'],
						media: [video('images/koi_pond/koi_shader.mp4', 'Koi swimming with the patterned, wiggling shader applied', 746, 339)]
					}
				]
			}
		]
	},
	{
		slug: 'fido-bot',
		name: 'Fido Bot',
		kicker: 'Discord bot',
		category: 'personal',
		summary:
			"A Discord bot that spreads emojis throughout a server by adding them to members' names. It also has per-server settings and a few moderation tools.",
		description:
			"A Discord bot whose main functionality is to spread emojis throughout the server by adding them to existing members' names. The bot has some additional functionality for moderation, which will be expanded upon in the future.",
		cover: discordCover,
		coverAlt: 'Fido Bot artwork',
		tech: ['Discord API', 'MongoDB'],
		links: [{ label: 'GitHub repository', href: 'https://github.com/JasonPKnoll/fido_bot' }],
		groups: [
			{
				title: 'Commands',
				sections: [
					{
						title: 'Admin commands',
						body: [
							'Admin commands only trigger when an admin is the one giving them. Otherwise the bot intentionally ignores them, with no indication that the command exists.',
							"Server settings are stored in MongoDB. This allows the bot to be used in multiple servers, each able to set its own preferred emoji to spread throughout people's names, and its own designated channel for the bot to forward users' DMs to."
						],
						media: [video('images/fido_bot/bot_admin_commands.mp4', 'Running admin commands in Discord', 1000, 178)],
						table: {
							columns: ['Command', 'Default', 'Example', 'Description'],
							rows: [
								['!setbotchannel', 'Null', '!setbotchannel admin-channel', 'Sets the channel that receives direct messages users send to the bot. Can be any channel in the server. By default no direct messages are forwarded until this is set.'],
								['!removeall', '', '', "Removes all instances of the set emoji from every user's name in the server."],
								['!setemoji', '🌽', '!setemoji 💕', "Sets the emoji that will be added to users' names by the other bot commands."],
								['!setaddword', 'this', '!setaddword add', 'Adds one emoji to any user that uses the word in a message.'],
								['!setsubtractword', 'that', '!setsubtractword remove', 'Removes every instance of the emoji from a user if they use the word in a message.'],
								['!setlotteryword', 'spread', '!setlotteryword random', 'When any user uses the word, the bot adds one emoji to five random users in the server (excluding admins).'],
								['!values', '', '', 'Displays the current emoji, add word, subtract word, and lottery word for the server.'],
								['!resetall', '', '', 'Resets the emoji, add word, subtract word, and lottery word back to their default values.']
							]
						}
					},
					{
						title: 'User commands',
						body: [
							'Commands any user can use to manually gain and give emojis to other users. The bot is unable to give emojis to anyone with equal or greater authority in the server, so it cannot give emojis to admins, and it has been set to ignore other bots.'
						],
						media: [video('images/fido_bot/bot_user_commands.mp4', 'Running user commands in Discord', 998, 190)],
						table: {
							columns: ['Command', 'Example', 'Description'],
							rows: [
								['!giveme', '!giveme 10', "Adds the given number of emojis to the user's name, up to the maximum allowed by the characters left in their nickname."],
								['!transferto', '!transferto @other_user 5', "Transfers the given number of emojis from one user's name to the specified user."]
							]
						}
					}
				]
			},
			{
				title: 'Meme listeners',
				sections: [
					{
						title: "What's with all the corn?",
						body: [
							'The corn, much like everything else in this section, is an inside joke for the server this bot was originally designed for.'
						],
						media: [video('images/fido_bot/bot_corn.mp4', 'Fido Bot responding enthusiastically to the word corn', 1362, 418)],
						table: {
							columns: ['Listener', 'Description'],
							rows: [
								['corn', 'On any instance of "corn" the bot responds with corn emojis, a corn quote, or yells about corn being spoken in its server. This includes GIFs or URLs with corn in the name, and words like corner or cornea. It is very sensitive to the word corn. It\'s a feature, not a bug!'],
								['who', 'Replies to the comment with "who", waits 3 seconds, then replies with "cares".'],
								['I love fido', 'Direct messages the user to say it loves them too, then changes their server nickname to "Fido\'s chew toy".'],
								['free me fido', "Removes the user's nickname, reverting them back to their original name."]
							]
						}
					}
				]
			}
		]
	},
	{
		slug: 'help-network',
		name: 'The HeLP Network',
		kicker: 'Full-stack web app',
		category: 'turing',
		summary:
			'A React app that helps professionals ask and find answers to important legal and ethical questions. Django + PostgreSQL backend, deployed with CircleCI.',
		description:
			'React based web app to help professionals ask and find important legal and ethical questions. Developed backend with Python, Django, PostgreSQL. Deployed to Heroku with CircleCI.',
		highlight: "Winner of the 2105 cohort's Turing School final project competition",
		cover: helpCover,
		coverContain: 'linear-gradient(#32394d 0 50%, #c8d1d9 50%)',
		coverAlt: 'The HeLP Network logo',
		tech: ['React', 'Python', 'Django', 'PostgreSQL', 'OAuth', 'Heroku', 'CircleCI'],
		links: [
			{ label: 'Backend repository', href: 'https://github.com/mental-health-org/mental_health_be' },
			{ label: 'Frontend repository', href: 'https://github.com/mental-health-org/mental-health-fe' }
		],
		groups: [
			{
				title: 'Mission',
				intro:
					'Our mission is to connect expertise across specialty areas of public helping professions to ask and find questions to important legal and ethical concerns central to helping support our communities and each other.',
				sections: [
					{
						title: 'Database schema',
						body: ['Relational database built out with PostgreSQL.'],
						schema: helpNetworkSchema
					}
				]
			},
			{
				title: 'Features',
				sections: [
					{
						title: 'Login with OAuth',
						body: ['Log in to The HeLP Network through your LinkedIn account via OAuth.'],
						media: [video('images/help_network/help_network_login.mp4', 'Logging in with LinkedIn OAuth on mobile', 393, 852)]
					},
					{
						title: 'Find answers',
						body: ['Easily browse through existing legal and ethical questions.'],
						media: [video('images/help_network/help_network_scroll.mp4', 'Scrolling through questions on mobile', 393, 852)]
					},
					{
						title: 'Search & vote',
						body: [
							'Search for questions through relevant tags or by title. Take an active role in the community by voting for the most useful questions and responses.'
						],
						media: [video('images/help_network/help_network_search_upvote.mp4', 'Searching questions by tag and upvoting', 393, 852)]
					},
					{
						title: 'Ask your own questions',
						body: [
							"Ask a new question and tag it with existing or new tags. Respond to others' questions, and freely edit or delete your previous questions and responses."
						],
						media: [video('images/help_network/help_network_ask.mp4', 'Asking and tagging a new question on mobile', 393, 852)]
					}
				]
			}
		]
	},
	{
		slug: 'virtual-watch-party',
		name: 'Virtual Watch Party',
		kicker: 'Rails web app',
		category: 'turing',
		summary:
			'A web app for organizing movie viewing events with friends. Ruby on Rails, RSpec and PostgreSQL, deployed with TravisCI.',
		description:
			'Web app that allows users to organize movie events. Developed backend with Ruby on Rails, RSpec and PostgreSQL. Deployed to Heroku with TravisCI.',
		cover: watchCover,
		coverAlt: 'Movie night illustration',
		tech: ['Ruby on Rails', 'RSpec', 'PostgreSQL', 'Heroku', 'TravisCI'],
		links: [{ label: 'GitHub repository', href: 'https://github.com/bfl3tch/viewing_party' }],
		groups: [
			{
				title: 'Features',
				sections: [
					{
						title: 'Register an account',
						body: ['Register an account, add friends, and set up a movie viewing event.'],
						media: [video('images/virtual_watch/virtual_watch_register.mp4', 'Registering an account and adding friends', 954, 479)]
					},
					{
						title: 'Search by title',
						body: ['Search for specific movies and invite anyone on your friends list to watch along.'],
						media: [video('images/virtual_watch/virtual_watch_search.mp4', 'Searching movies by title and creating an event', 954, 479)]
					},
					{
						title: 'Browse the top 40',
						body: ['Browse movies by the current top 40 list.'],
						media: [video('images/virtual_watch/virtual_watch_top_40.mp4', 'Browsing the top 40 movies list', 789, 396)]
					}
				]
			}
		]
	},
	{
		slug: 'weatheraza',
		name: 'Weatheraza',
		kicker: 'Rails API',
		category: 'turing',
		summary:
			'Collates data from three separate APIs so users can see the weather at a specified destination. Ruby on Rails, RSpec and PostgreSQL.',
		description:
			"Web app which collates data from three separate API's for users to see weather at a specified destination. Developed backend with Ruby on Rails, RSpec, and PostgreSQL.",
		cover: weatherCover,
		coverAlt: 'Illustration of the four seasons',
		tech: ['Ruby on Rails', 'RSpec', 'PostgreSQL', 'REST APIs'],
		links: [{ label: 'GitHub repository', href: 'https://github.com/JasonPKnoll/weatheraza' }],
		groups: []
	}
];

export const categories = {
	personal: 'Personal',
	turing: 'Turing School'
} as const;

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
