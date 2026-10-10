// Closed-overlay baselines for CX-10: what a page pays for overlays nobody has opened yet.
import { expect, test } from 'vitest';
import { countAll, createFixture, measure } from './fixture.js';

const COUNT = 300;

test('Popover: mount 300 closed popovers', async ({ bench }) => {
	const fixture = createFixture('closed-popovers', COUNT);
	await measure(
		bench,
		{ name: 'closed popovers mount (300)', file: 'closed-popovers-mount-300' },
		{
			afterEach() {
				const mounted = countAll('[aria-haspopup="dialog"]');
				fixture.unmount();
				expect(mounted).toBe(COUNT);
			}
		},
		() => {
			fixture.mount();
		}
	);
});

test('Select: mount 300 closed selects', async ({ bench }) => {
	const fixture = createFixture('closed-selects', COUNT);
	await measure(
		bench,
		{ name: 'closed selects mount (300)', file: 'closed-selects-mount-300' },
		{
			afterEach() {
				const mounted = countAll('[role="combobox"]');
				fixture.unmount();
				expect(mounted).toBe(COUNT);
			}
		},
		() => {
			fixture.mount();
		}
	);
});
