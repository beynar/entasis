// Closed-overlay baselines for CX-10: what a page pays for overlays nobody has opened yet.
import { expect, test } from 'vitest';
import { countAll, createFixture, measure } from './fixture.js';

const COUNT = 300;
const ROWS = 200;

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

// The case CX-10 names first: a data grid with a row-actions menu on every row.
test('DataTable: mount 200 rows with a closed row menu each', async ({ bench }) => {
	const fixture = createFixture('datatable-row-menus', ROWS);
	await measure(
		bench,
		{ name: 'datatable row menus mount (200 rows)', file: 'datatable-row-menus-mount-200' },
		{
			afterEach() {
				// The header's column menu has a trigger too; count the row menus by their label.
				const mounted = countAll('[aria-haspopup="menu"][aria-label^="Actions for"]');
				fixture.unmount();
				expect(mounted).toBe(ROWS);
			}
		},
		() => {
			fixture.mount();
		}
	);
});
