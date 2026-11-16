// The Tour renders nothing on the server, open or not: its backdrop, spotlight and popup measure
// targets in the browser, so a page that opens one on load hydrates without a mismatch, and a
// `tourTarget` attachment leaves the target's own markup untouched.
import type { Component } from 'svelte';
import { expect, test } from 'vitest';
import { renderInThemeServer } from '../Theme/renderInThemeServer.test-helper.js';
import Tour from './Tour.svelte';
import type { TourStep } from './tour.props.js';

const steps: TourStep[] = [
	{ target: '#first', title: 'First step', description: 'The first button.' },
	{ target: null, title: 'Centred step', description: 'No target.' }
];

const serverRender = async (props: Record<string, unknown>) =>
	(await renderInThemeServer(Tour as unknown as Component<Record<string, unknown>>, props)).body;

test('a closed tour renders nothing on the server', async () => {
	const html = await serverRender({ steps });
	expect(html).not.toContain('data-entasis-tour');
	expect(html).not.toContain('First step');
});

test('an open tour waits for the browser: no backdrop, no popup, no step text', async () => {
	const html = await serverRender({ steps, open: true, defaultStep: 1 });
	expect(html).not.toContain('data-entasis-tour');
	expect(html).not.toContain('<dialog');
	expect(html).not.toContain('Centred step');
});
