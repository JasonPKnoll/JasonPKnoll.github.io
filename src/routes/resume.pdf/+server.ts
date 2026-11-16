import { resumePdf } from '#lib/server/resume-pdf.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () =>
	new Response(await resumePdf(), {
		headers: { 'Content-Type': 'application/pdf' }
	});
