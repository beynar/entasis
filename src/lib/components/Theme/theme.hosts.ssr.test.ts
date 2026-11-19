// The server markup of the hosts `<Theme>` mounts on demand: the backdrop of a dialog that is open
// on the server is part of it, as it was when Theme always rendered one; the tooltip surface never
// is (a tooltip opens from an effect or an event).
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Harness from './ThemeHostsHarness.test.svelte';

describe('Theme hosts on the server', () => {
	test('a page without dialogs renders no backdrop', () => {
		const { body } = render(Harness, { props: { tooltips: 2, tooltipComponent: true } });
		expect(body).not.toContain('data-dialog-backdrop');
		expect(body).not.toContain('role="tooltip"');
	});

	test('a closed dialog renders no backdrop', () => {
		const { body } = render(Harness, { props: { dialogs: 1 } });
		expect(body).not.toContain('data-dialog-backdrop');
	});

	test('a dialog open on the server dims the page from the first paint', () => {
		const { body } = render(Harness, { props: { dialogs: 1, defaultOpen: true } });
		expect(body.match(/data-dialog-backdrop/g)).toHaveLength(1);
	});
});
