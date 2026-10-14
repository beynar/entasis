// Where a submenu opens: beside its row on the reading direction's end side, and below the row
// when neither side of the menu has room (`fallbackAxisSide: 'end'`). The root menu keeps its own
// axis. jsdom has no layout, so the test reads what the Popover asks floating-ui for.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Placement } from '@floating-ui/dom';
import PopupMenu from '../PopupMenu/PopupMenu.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

type PositionOptions = {
	placement: Placement;
	middleware: { name: string; options: Record<string, unknown> }[];
};
const { computePosition } = vi.hoisted(() => ({
	computePosition: vi.fn(async (_reference: unknown, _floating: unknown, options?: unknown) => ({
		x: 0,
		y: 0,
		strategy: 'fixed' as const,
		placement: (options as PositionOptions).placement,
		middlewareData: {}
	}))
}));
vi.mock('@floating-ui/dom', async (importOriginal) => ({
	...(await importOriginal<typeof import('@floating-ui/dom')>()),
	computePosition
}));

const menus = () => screen.queryAllByRole('menu');
/** The last placement asked for the panel that holds `menu`. */
const placementOf = (menu: HTMLElement) => {
	const call = computePosition.mock.calls.findLast(([, wrapper]) =>
		(wrapper as HTMLElement).contains(menu)
	);
	return call?.[2] as PositionOptions;
};
const flipOf = (options: PositionOptions) =>
	options.middleware.find(({ name }) => name === 'flip')!.options;

const openMenus = async () => {
	renderInTheme(PopupMenu, {
		trigger: { content: 'File' },
		menu: {
			items: [
				{ type: 'option', title: 'New file' },
				{ type: 'submenu', title: 'Share', menu: [{ type: 'option', title: 'Copy link' }] }
			],
			submenuMode: 'popover'
		}
	});
	await fireEvent.click(screen.getByRole('button', { name: 'File' }));
	await waitFor(() => expect(menus()).toHaveLength(1));
	const root = menus()[0];
	await fireEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
	await waitFor(() => expect(menus()).toHaveLength(2));
	const submenu = menus()[1];
	await waitFor(() => expect(placementOf(submenu)).toBeDefined());
	return { root: placementOf(root), submenu: placementOf(submenu) };
};

/** A `md` viewport (768–1023px), where submenus fly out beside their row. */
const mediumViewport = (query: string) => ({
	matches: /min-width: (640|768)px/.test(query),
	media: query,
	onchange: null,
	addEventListener: () => {},
	removeEventListener: () => {},
	addListener: () => {},
	removeListener: () => {},
	dispatchEvent: () => false
});

describe('submenu position', () => {
	const matchMedia = window.matchMedia;
	beforeEach(() => {
		window.matchMedia = mediumViewport as unknown as typeof window.matchMedia;
	});
	afterEach(() => {
		window.matchMedia = matchMedia;
		document.documentElement.removeAttribute('dir');
	});

	test('a submenu opens on the inline end and falls back below its row; the root menu does not', async () => {
		const { root, submenu } = await openMenus();
		expect(submenu.placement).toBe('right-start');
		expect(flipOf(submenu).fallbackAxisSideDirection).toBe('end');
		expect(flipOf(root).fallbackAxisSideDirection).toBe('none');
	});

	test('in a right-to-left document the submenu opens on the left', async () => {
		document.documentElement.dir = 'rtl';
		const { submenu } = await openMenus();
		expect(submenu.placement).toBe('left-start');
	});
});
