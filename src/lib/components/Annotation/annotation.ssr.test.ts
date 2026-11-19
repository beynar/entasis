import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Annotation from './Annotation.svelte';

describe('Annotation server rendering', () => {
	test('renders the target, the arrow and the note, and describes the target by the note', () => {
		const { body } = render(Annotation, {
			props: { children: 'in real time', note: 'no refresh needed', color: 'warning' }
		});

		expect(body).toMatch(/<span[^>]*data-slot="annotation"/);
		expect(body).toContain('data-placement="bottom"');
		expect(body).toContain('data-highlight');
		expect(body).toContain('in real time');
		expect(body).toMatch(/<svg[^>]*data-slot="annotation-arrow"[^>]*aria-hidden="true"/);
		expect(body).toContain('no refresh needed');

		const id = body.match(/aria-describedby="([^"]+)"/)?.[1];
		expect(id).toBeTruthy();
		expect(body).toMatch(new RegExp(`<span[^>]*id="${id}"[^>]*data-slot="annotation-label"`));
		expect(body).not.toMatch(/data-slot="annotation-label"[^>]*aria-hidden/);
	});

	test('without a note it is a marker alone', () => {
		const { body } = render(Annotation, { props: { children: 'important', note: '  ' } });

		expect(body).toContain('important');
		expect(body).not.toContain('annotation-arrow');
		expect(body).not.toContain('annotation-label');
		expect(body).not.toContain('aria-describedby');
		expect(body).not.toContain('data-placement');
	});

	test('a decorative note is hidden and describes nothing', () => {
		const { body } = render(Annotation, {
			props: { children: 'target', note: 'look', decorative: true, placement: 'top-end' }
		});

		expect(body).toContain('data-placement="top-end"');
		expect(body).not.toContain('aria-describedby');
		expect(body).toMatch(/data-slot="annotation-label"[^>]*aria-hidden="true"/);
	});

	test('`draw` marks the root, and the arrow strokes are measured from 0 to 1', () => {
		const plain = render(Annotation, { props: { children: 'target', note: 'look' } }).body;
		expect(plain).not.toContain('data-draw');
		expect(plain.match(/pathLength="1"/g)).toHaveLength(2);

		const drawn = render(Annotation, { props: { children: 'target', note: 'look', draw: true } });
		// It waits: the browser starts it once the annotation is in view.
		expect(drawn.body).toContain('data-draw="wait"');
	});

	test('it can go round a block, without a tint, in the rainbow', () => {
		const { body } = render(Annotation, {
			props: { children: 'card', note: 'new', as: 'div', highlight: false, color: 'rainbow' }
		});

		expect(body).toMatch(/<div[^>]*data-slot="annotation"/);
		expect(body).toContain('data-rainbow');
		expect(body).not.toContain('data-highlight');
	});
});
