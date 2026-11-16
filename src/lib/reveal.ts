import type { Attachment } from 'svelte/attachments';

/**
 * Fade/slide an element in the first time it scrolls into view.
 * Pair with `class="reveal"` in markup; styles only apply when JS is running.
 */
export function reveal(delay = 0): Attachment<HTMLElement> {
	return (node) => {
		if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						node.classList.add('revealed');
						observer.disconnect();
					}
				}
			},
			{ rootMargin: '0px 0px -10% 0px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	};
}
