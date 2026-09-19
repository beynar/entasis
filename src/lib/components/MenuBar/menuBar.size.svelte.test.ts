// The bar's `size` reaches the menu each trigger drops. `getMenuProps` builds its result from
// `{ ...menu }`, so a `MenuBarMenu` written or spread with an explicit `size: undefined` still
// carries that key — spreading the bar's `size` first let that undefined win, and MenuFloating's
// own `size = 'normal'` default then replaced the bar's size instead of the menu inheriting it.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import MenuBar from './MenuBar.svelte';
import type { MenuBarMenu } from './menuBar.props.js';

const open = async (label: string) => {
	await fireEvent.click(screen.getByRole('menuitem', { name: label }));
	return waitFor(() => {
		const [panel] = screen.getAllByRole('menu');
		expect(panel).toBeInTheDocument();
		return panel;
	});
};

const menu = (extra: Partial<MenuBarMenu> = {}): MenuBarMenu => ({
	label: 'File',
	items: [{ type: 'option', title: 'New file' }],
	...extra
});

describe('menu bar size inheritance', () => {
	test('the dropped menu renders on the bar size', async () => {
		renderInTheme(MenuBar, { menus: [menu()], size: 'small' });
		expect((await open('File')).dataset.size).toBe('small');
	});

	test('an explicit size: undefined on a menu does not drop the bar size', async () => {
		renderInTheme(MenuBar, { menus: [menu({ size: undefined })], size: 'large' });
		expect((await open('File')).dataset.size).toBe('large');
	});

	test('a per-menu size wins over the bar size', async () => {
		renderInTheme(MenuBar, { menus: [menu({ size: 'large' })], size: 'small' });
		expect((await open('File')).dataset.size).toBe('large');
	});
});
