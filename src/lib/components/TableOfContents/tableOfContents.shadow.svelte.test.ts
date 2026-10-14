// Heading ids are resolved in the tree the table of contents renders in. Inside a shadow root
// `document.getElementById` cannot see sibling elements, so a generated id could collide.
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import TableOfContents from './TableOfContents.svelte';

let host: HTMLElement | null = null;
let component: ReturnType<typeof mount> | null = null;

afterEach(() => {
	if (component) unmount(component);
	component = null;
	host?.remove();
	host = null;
});

describe('TableOfContents in a shadow root', () => {
	test('a generated heading id avoids an id already taken inside the same shadow root', async () => {
		host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const content = document.createElement('article');
		const taken = document.createElement('div');
		taken.id = 'toc-intro';
		const heading = document.createElement('h2');
		heading.textContent = 'Intro';
		content.append(taken, heading);
		const mountPoint = document.createElement('nav');
		shadow.append(content, mountPoint);
		expect(document.getElementById('toc-intro')).toBeNull();

		component = mount(TableOfContents, {
			target: mountPoint,
			props: { target: content, levels: [2] }
		});
		flushSync();
		await tick();

		expect(heading.id).toBe('toc-intro-2');
		expect(taken.id).toBe('toc-intro');
	});
});
