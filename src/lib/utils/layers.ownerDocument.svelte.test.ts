// A layer whose panel lives in another document (an iframe, a portal container there) hears its
// own Escape and outside presses: the stack listens on the owner document of its nodes (CX-12).
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import LayersOwnerDocumentHarness from './LayersOwnerDocumentHarness.test.svelte';

const frames: HTMLIFrameElement[] = [];
const createFrame = () => {
	const frame = document.createElement('iframe');
	document.body.append(frame);
	frames.push(frame);
	const frameDocument = frame.contentDocument!;
	const panel = frameDocument.createElement('div');
	const outside = frameDocument.createElement('p');
	frameDocument.body.append(panel, outside);
	return { frameDocument, view: frame.contentWindow as Window & typeof globalThis, panel, outside };
};

// Presses must come after the layer opened (`openedAt`), as they do for a real user.
const later = () => new Promise((resolve) => setTimeout(resolve, 15));

afterEach(() => {
	for (const frame of frames.splice(0)) frame.remove();
});

describe('layer listeners on the owner document', () => {
	test('an outside press inside the iframe dismisses a layer rendered there', async () => {
		const { panel, outside, view } = createFrame();
		const onDismiss = vi.fn();
		render(LayersOwnerDocumentHarness, { props: { open: true, nodes: [panel], onDismiss } });
		await tick();
		await later();

		panel.dispatchEvent(new view.Event('pointerdown', { bubbles: true }));
		expect(onDismiss).not.toHaveBeenCalled();
		outside.dispatchEvent(new view.Event('pointerdown', { bubbles: true }));
		expect(onDismiss).toHaveBeenCalledOnce();
		expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ reason: 'outside-press' }));
	});

	test('Escape pressed inside the iframe dismisses the layer', async () => {
		const { panel, view } = createFrame();
		const onDismiss = vi.fn();
		render(LayersOwnerDocumentHarness, { props: { open: true, nodes: [panel], onDismiss } });
		await tick();

		view.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
		expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ reason: 'escape-key' }));
	});

	test('the page document still dismisses the layer', async () => {
		const { panel } = createFrame();
		const onDismiss = vi.fn();
		render(LayersOwnerDocumentHarness, { props: { open: true, nodes: [panel], onDismiss } });
		await tick();
		await later();

		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	test('a closed layer listens nowhere', async () => {
		const { panel, outside, view } = createFrame();
		const onDismiss = vi.fn();
		render(LayersOwnerDocumentHarness, { props: { open: false, nodes: [panel], onDismiss } });
		await tick();
		await later();

		outside.dispatchEvent(new view.Event('pointerdown', { bubbles: true }));
		view.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape' }));
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		expect(onDismiss).not.toHaveBeenCalled();
	});

	test('closing removes the iframe listeners', async () => {
		const { panel, outside, view } = createFrame();
		const onDismiss = vi.fn();
		const { rerender } = render(LayersOwnerDocumentHarness, {
			props: { open: true, nodes: [panel], onDismiss }
		});
		await tick();
		await rerender({ open: false });
		await tick();

		outside.dispatchEvent(new view.Event('pointerdown', { bubbles: true }));
		expect(onDismiss).not.toHaveBeenCalled();
	});
});
