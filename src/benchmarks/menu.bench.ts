// Large-menu baselines for MN-13: mounting a 500-item Menu, and moving the highlight through it.
import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { countAll, createFixture, measure } from './fixture.js';

const ITEMS = 500;

test('Menu: mount 500 items', async ({ bench }) => {
	const fixture = createFixture('menu', ITEMS);
	await measure(
		bench,
		{ name: 'menu mount (500 items)', file: 'menu-mount-500' },
		{
			afterEach() {
				const mounted = countAll('[role="menuitem"]');
				fixture.unmount();
				expect(mounted).toBe(ITEMS);
			}
		},
		() => {
			fixture.mount();
		}
	);
});

test('Menu: one ArrowDown highlight move among 500 items', async ({ bench }) => {
	const fixture = createFixture('menu', ITEMS);
	const press = () => {
		const active = document.activeElement as HTMLElement;
		active.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
		);
		flushSync();
	};
	const target = fixture.mount();
	try {
		target.querySelector<HTMLElement>('[role="menuitem"]')!.focus();
		flushSync();
		// Attribute writes per move, the number MN-13 brings down to at most four.
		const setAttribute = Element.prototype.setAttribute;
		let writes = 0;
		Element.prototype.setAttribute = function countedSetAttribute(name, value) {
			writes += 1;
			return setAttribute.call(this, name, value);
		};
		const before = document.activeElement;
		press();
		Element.prototype.setAttribute = setAttribute;
		expect(document.activeElement).not.toBe(before);
		console.info(`menu highlight move (500 items): ${writes} setAttribute calls`);

		await measure(
			bench,
			{ name: 'menu highlight move (500 items)', file: 'menu-highlight-move-500' },
			{},
			press
		);
	} finally {
		fixture.unmount();
	}
});
