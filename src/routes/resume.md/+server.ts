import { resumeMarkdown } from '#lib/resume.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(resumeMarkdown(), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
