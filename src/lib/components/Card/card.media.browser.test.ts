// `media` puts a face before the title: the title and its description line up beside it, the face
// centred on them, and the action keeps the far end.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './CardMediaHarness.test.svelte';

const box = (id: string) =>
	document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
// The part that holds a test id: the wrapper the Card lays out.
const part = (id: string) =>
	document.querySelector(`[data-testid="${id}"]`)!.parentElement!.getBoundingClientRect();

test('the title and description sit beside the face, which is centred on them', async () => {
	await render(Harness);
	const face = box('face');
	const title = part('title');
	const description = part('subtitle');
	const action = part('action');

	expect(title.left).toBeGreaterThan(face.right);
	expect(description.left).toBe(title.left);
	expect(description.top).toBeGreaterThanOrEqual(title.bottom);
	const middle = (title.top + description.bottom) / 2;
	expect(Math.abs(face.top + face.height / 2 - middle)).toBeLessThanOrEqual(1);
	expect(action.left).toBeGreaterThanOrEqual(title.right);
	expect(action.right).toBeGreaterThan(description.right);
});

test('without a description, the face is centred on the title alone', async () => {
	await render(Harness, { withDescription: false, withAction: false });
	const face = box('face');
	const title = part('title');
	expect(title.left).toBeGreaterThan(face.right);
	expect(Math.abs(face.top + face.height / 2 - (title.top + title.height / 2))).toBeLessThanOrEqual(
		1
	);
});
