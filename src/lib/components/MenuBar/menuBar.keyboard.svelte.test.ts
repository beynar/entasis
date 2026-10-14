// A menu bar opens its menu on the first row with ArrowDown and on the last row with ArrowUp, and
// leaves focus where Tab put it when the menu closes.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import MenuBar from './MenuBar.svelte';

const menus = () => screen.queryAllByRole('menu');
const mount = () =>
	renderInTheme(MenuBar, {
		menus: [
			{
				label: 'File',
				items: [
					{ type: 'option', title: 'New' },
					{ type: 'option', title: 'Open' },
					{ type: 'option', title: 'Quit' }
				]
			},
			{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] }
		]
	});

describe('opening a menu from its trigger', () => {
	test('a11y:menu-bar.arrow-opens ArrowDown highlights the first row', async () => {
		mount();
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowDown' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'New' }))
		);
	});

	test('ArrowUp highlights the last row', async () => {
		mount();
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowUp' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Quit' }))
		);
	});

	test('moving to the next menu with the arrow keys opens it on its first row', async () => {
		mount();
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowUp' });
		await waitFor(() => expect(menus()).toHaveLength(1));
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Undo' }))
		);
	});
});

describe('closing', () => {
	test('a menu that closes does not take focus back from a control Tab reached', async () => {
		mount();
		const outside = document.createElement('button');
		document.body.append(outside);
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowDown' });
		await waitFor(() => expect(menus()).toHaveLength(1));

		outside.focus();
		await fireEvent.keyDown(outside, { key: 'Escape' });
		await waitFor(() => expect(menus()).toHaveLength(0), { timeout: 1500 });
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});
});
