/**
 * Builds the downloadable resume PDF at build time from #lib/resume.ts.
 *
 * Kept deliberately plain so applicant tracking systems and AI reviewers can
 * read it: one column, real selectable text in standard fonts, no tables or
 * images, sections in the usual order, and clickable links.
 */
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { resume } from '#lib/resume.ts';

const PAGE = { w: 612, h: 792 }; // US Letter
const M = { x: 54, top: 50, bottom: 50 };
const WIDTH = PAGE.w - M.x * 2;

const ink = rgb(0.1, 0.11, 0.14);
const muted = rgb(0.36, 0.38, 0.44);
const accent = rgb(0.05, 0.47, 0.38);
const rule = rgb(0.82, 0.84, 0.87);

export async function resumePdf(): Promise<Uint8Array<ArrayBuffer>> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(`${resume.name} Resume`);
	pdf.setAuthor(resume.name);
	pdf.setSubject(`${resume.headline} resume`);
	pdf.setKeywords([resume.headline, ...resume.skills]);
	pdf.setCreator('jpknoll.com');
	pdf.setProducer('jpknoll.com');
	pdf.setLanguage('en-US');

	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

	let page: PDFPage = pdf.addPage([PAGE.w, PAGE.h]);
	let y = PAGE.h - M.top;

	const ensure = (height: number) => {
		if (y - height < M.bottom) {
			page = pdf.addPage([PAGE.w, PAGE.h]);
			y = PAGE.h - M.top;
		}
	};

	const wrap = (text: string, font: PDFFont, size: number, width: number) => {
		const lines: string[] = [];
		let line = '';
		for (const word of text.split(/\s+/)) {
			const next = line ? `${line} ${word}` : word;
			if (font.widthOfTextAtSize(next, size) > width && line) {
				lines.push(line);
				line = word;
			} else line = next;
		}
		if (line) lines.push(line);
		return lines;
	};

	const link = (x: number, baseline: number, width: number, size: number, url: string) => {
		const annot = pdf.context.obj({
			Type: 'Annot',
			Subtype: 'Link',
			Rect: [x, baseline - 2, x + width, baseline + size],
			Border: [0, 0, 0],
			A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) }
		});
		page.node.addAnnot(pdf.context.register(annot));
	};

	const paragraph = (
		text: string,
		{ font = regular, size = 9.8, color = ink, indent = 0, leading = 1.42 } = {}
	) => {
		const lh = size * leading;
		for (const line of wrap(text, font, size, WIDTH - indent)) {
			ensure(lh);
			y -= lh;
			page.drawText(line, { x: M.x + indent, y, size, font, color });
		}
	};

	/** A left label and a right-aligned date on the same line. */
	const row = (left: { text: string; font: PDFFont; size: number; color?: typeof ink }[], right: string) => {
		const size = Math.max(...left.map((l) => l.size));
		const lh = size * 1.45;
		ensure(lh);
		y -= lh;
		let x = M.x;
		for (const part of left) {
			page.drawText(part.text, { x, y, size: part.size, font: part.font, color: part.color ?? ink });
			x += part.font.widthOfTextAtSize(part.text, part.size);
		}
		if (right) {
			const w = regular.widthOfTextAtSize(right, 9.5);
			page.drawText(right, { x: M.x + WIDTH - w, y, size: 9.5, font: regular, color: muted });
		}
	};

	const heading = (text: string) => {
		ensure(40);
		y -= 24;
		page.drawText(text.toUpperCase(), { x: M.x, y, size: 10.5, font: bold, color: accent });
		y -= 5;
		page.drawLine({ start: { x: M.x, y }, end: { x: M.x + WIDTH, y }, thickness: 0.6, color: rule });
		y -= 2;
	};

	// Header
	y -= 24;
	page.drawText(resume.name, { x: M.x, y, size: 24, font: bold, color: ink });
	y -= 18;
	page.drawText(resume.headline, { x: M.x, y, size: 12, font: bold, color: accent });
	const traits = `  |  ${resume.traits.join(', ')}`;
	page.drawText(traits, {
		x: M.x + bold.widthOfTextAtSize(resume.headline, 12),
		y,
		size: 9.5,
		font: italic,
		color: muted
	});

	// Contact line, with each piece clickable. Wraps if it ever gets too long.
	const contact = [
		{ text: resume.location },
		{ text: resume.email, url: `mailto:${resume.email}` },
		...resume.links.map((l) => ({ text: l.label, url: l.href }))
	];
	const size = 9.5;
	const sep = '  |  ';
	y -= 16;
	let x = M.x;
	contact.forEach((c, i) => {
		const w = regular.widthOfTextAtSize(c.text, size);
		if (x + w > M.x + WIDTH) {
			x = M.x;
			y -= size * 1.5;
		}
		page.drawText(c.text, { x, y, size, font: regular, color: c.url ? ink : muted });
		if (c.url) link(x, y, w, size, c.url);
		x += w;
		if (i < contact.length - 1) {
			page.drawText(sep, { x, y, size, font: regular, color: rule });
			x += regular.widthOfTextAtSize(sep, size);
		}
	});
	y -= 6;

	heading('Summary');
	paragraph(resume.summary);

	heading('Skills');
	paragraph(resume.skills.join(', '));

	heading('Experience');
	resume.experience.forEach((job, j) => {
		if (j > 0) y -= 9;
		row(
			[
				{ text: job.company, font: bold, size: 11.5 },
				{ text: `  |  ${job.location}`, font: regular, size: 9.5, color: muted }
			],
			job.period
		);
		for (const role of job.roles) {
			const single = job.roles.length === 1;
			y -= single ? 0 : 7;
			row([{ text: role.title, font: bold, size: 10.2, color: accent }], single ? '' : role.period);
			y -= 1;
			paragraph(role.summary);
			for (const h of role.highlights) {
				const lines = wrap(h, regular, 9.8, WIDTH - 14);
				ensure(lines.length * 14);
				y -= 2;
				page.drawText('•', { x: M.x + 3, y: y - 13.9, size: 9.8, font: regular, color: accent });
				for (const line of lines) {
					y -= 13.9;
					page.drawText(line, { x: M.x + 14, y, size: 9.8, font: regular, color: ink });
				}
			}
		}
	});

	heading('Education');
	for (const e of resume.education) {
		row(
			[
				{ text: e.credential, font: bold, size: 10.2 },
				{ text: `  |  ${e.school}`, font: regular, size: 9.8, color: muted }
			],
			e.year
		);
	}

	// Open at the top, fit to width.
	pdf.catalog.set(PDFName.of('PageLayout'), PDFName.of('OneColumn'));

	// Copy into a plain ArrayBuffer-backed array so it is a valid Response body.
	return new Uint8Array(await pdf.save());
}
