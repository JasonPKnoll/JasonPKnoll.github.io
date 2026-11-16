export const site = {
	name: 'Jason Knoll',
	role: 'Software Developer',
	url: 'https://www.jpknoll.com',
	description:
		'Jason Knoll is a software developer building full-stack web apps, Discord bots, and VR experiences with React, Python, Ruby on Rails, Unity, and Blender.',
	/** Default social share card (static/og-image.jpg, regenerate if the portrait changes). */
	ogImage: {
		src: '/og-image.jpg',
		width: 1200,
		height: 630,
		alt: 'Jason Knoll, Software Developer. Web apps, bots, and virtual reality.'
	},
	email: 'jason.p.knoll@gmail.com',

	tagline: 'I build for the web, and for worlds you can step into.',
	intro:
		'Results-driven software developer with a passion for collaboration, constant growth, and building 3D environments for virtual reality.',

	about: [
		'A results-driven software developer. I thoroughly enjoy working in unison with others to solve complex problems. I have a passion for constant self-growth and improvement. Finding fulfillment in work was the most substantial contributor to my career transition into software development. Before finding my appreciation for software development, I worked in financial sales for seven years. I was able to thrive in my previous role through my constant desire to improve, learn, and teach others.',
		'I have a passion for building 3D models and environments for Virtual Reality. I spend much of my free time exploring technologies such as Blender, Unity, C#, Amplify, etc. that I utilize in the creation of VR environments.',
		'I love to learn from and teach others. Communities that cultivate a collaborative culture will always thrive, innovate, and inspire others. This is why I strive to cultivate collaboration in all endeavors I take on. Be it at work or through my hobbies in programming, music, or 3D modeling.'
	],

	stack: {
		'Web & backend': ['React', 'Python', 'Django', 'Ruby on Rails', 'RSpec', 'PostgreSQL', 'MongoDB'],
		'3D & VR': ['Unity', 'C#', 'Blender', 'Amplify Shader Editor'],
		'Delivery': ['Heroku', 'CircleCI', 'TravisCI', 'OAuth']
	} as Record<string, string[]>,

	/** In display order (contact section and footer). */
	socials: [
		{
			name: 'linkedin',
			label: 'LinkedIn',
			handle: 'in/jason-p-knoll',
			href: 'https://www.linkedin.com/in/jason-p-knoll'
		},
		{ name: 'github', label: 'GitHub', handle: '@JasonPKnoll', href: 'https://github.com/JasonPKnoll' },
		{
			name: 'discord',
			label: 'Discord',
			handle: 'Message me',
			href: 'https://discord.com/users/948668827355463800'
		},
		{ name: 'itch', label: 'itch.io', handle: 'timelincoln', href: 'https://timelincoln.itch.io' },
		{ name: 'x', label: 'X (Twitter)', handle: '@JasonPKnoll', href: 'https://x.com/JasonPKnoll' }
	]
} as const;
