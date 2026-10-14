// The Tree context menu is a host of Menu: rows that keep a menu open elsewhere keep it open here.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { MenuItem } from '../Menu/menu.props.js';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import TreeContextMenuSurface from './TreeContextMenuSurface.svelte';
import type { TreeContextMenuSnippetData } from './TreeSnippetRenderer.js';

const mount = (items: MenuItem[]) => {
	const close = vi.fn();
	const data = {
		context: { anchorRect: { x: 10, y: 10, width: 0, height: 0 }, close },
		close
	} as unknown as TreeContextMenuSnippetData;
	renderInTheme(TreeContextMenuSurface, { data, items });
	return close;
};

describe('Tree context menu', () => {
	test('a11y:tree.context-menu-keep-open a checkbox row and a closeOnClick: false row keep the menu open', async () => {
		const close = mount([
			{ type: 'checkbox', title: 'Show hidden', defaultValue: false },
			{ type: 'option', title: 'Pin', closeOnClick: false },
			{ type: 'option', title: 'Rename' }
		]);
		const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Show hidden' });
		await fireEvent.click(checkbox);
		expect(checkbox).toHaveAttribute('aria-checked', 'true');
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Pin' }));
		expect(close).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
		expect(close).toHaveBeenCalledTimes(1);
	});
});
