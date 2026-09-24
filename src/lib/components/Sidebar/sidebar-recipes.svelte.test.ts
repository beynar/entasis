// The restyle recipes documented in sidebar.mcp.ts, rendered: each one must keep working, so a
// consumer who copies it gets what the doc promises. The assertions are on the merged class list,
// the thing an override can get wrong (a class that coexists with the default instead of
// replacing it), not on computed styles.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import SidebarSurfaceHarness from './SidebarSurfaceHarness.test.svelte';
import type { SidebarThemeProps } from './sidebar.theme.js';

const classes = (selector: string) => Array.from(document.querySelector(selector)?.classList ?? []);
const panel = () => classes('[data-slot="sidebar-panel"]');
const activeRow = () => classes('[data-sidebar="menu-button"][data-active="true"]');

export const sidebarRecipes = {
	darkPanel: { panel: { base: 'dark bg-slate-900' }, mobilePanel: { base: 'dark bg-slate-900' } },
	activeRow: {
		menuButton: {
			base: 'rounded-full',
			activeVariant: {
				solid:
					'data-[active-variant=solid]:data-active:bg-indigo-600 data-[active-variant=solid]:data-active:text-white'
			}
		}
	},
	noHover: {
		menuButton: { base: 'state-layer-none hover:text-inherit' },
		subButton: { base: 'state-layer-none hover:text-neutral/70' }
	},
	flatPanel: {
		panel: {
			base: 'raised-none',
			variant: { admin: 'data-[side=left]:border-r-0 data-[side=right]:border-l-0' }
		}
	},
	rowHeight: { menuButton: { base: 'h-11' } }
} satisfies Record<string, SidebarThemeProps>;

describe('sidebar restyle recipes', () => {
	test('dark panel: the dark theme scope and the navy fill land on the panel', () => {
		render(SidebarSurfaceHarness, { props: { theme: sidebarRecipes.darkPanel } });
		expect(panel()).toEqual(expect.arrayContaining(['dark', 'bg-slate-900']));
		expect(panel().filter((c) => /^bg-surface/.test(c))).toEqual([]);
	});

	test('active row: the same prefix chain replaces the default recipe instead of coexisting', () => {
		render(SidebarSurfaceHarness, {
			props: { activeVariant: 'solid', theme: sidebarRecipes.activeRow }
		});
		expect(activeRow()).toContain('data-[active-variant=solid]:data-active:bg-indigo-600');
		expect(activeRow()).not.toContain('data-[active-variant=solid]:data-active:bg-selected');
		expect(activeRow()).toContain('rounded-full');
	});

	test('no hover: the overlay is off and the default hover ink is cancelled, on rows and sub rows', () => {
		render(SidebarSurfaceHarness, {
			props: {
				theme: sidebarRecipes.noHover,
				items: [
					{
						label: 'Workspace',
						items: [
							{
								label: 'Inbox',
								href: '#inbox',
								isActive: true,
								defaultOpen: true,
								items: [{ label: 'Archive', href: '#archive' }]
							}
						]
					}
				]
			}
		});
		const sub = classes('[data-sidebar="menu-sub-button"]');
		expect(sub).toContain('hover:text-neutral/70');
		expect(sub).not.toContain('hover:text-neutral');
		expect(sub).toContain('state-layer-none');
		expect(activeRow()).toContain('state-layer-none');
		expect(activeRow()).not.toContain('state-layer');
		expect(activeRow()).toContain('hover:text-inherit');
		expect(activeRow()).not.toContain('hover:text-neutral');
	});

	test('flat panel: the prefixed edge is replaced, not shadowed', () => {
		render(SidebarSurfaceHarness, { props: { theme: sidebarRecipes.flatPanel } });
		expect(panel()).toContain('data-[side=left]:border-r-0');
		expect(panel()).not.toContain('data-[side=left]:border-r');
		expect(panel().filter((c) => /^(raised|lift)-(?!none$)/.test(c))).toEqual([]);
	});

	test('row height: a plain height beats the compound control height', () => {
		render(SidebarSurfaceHarness, { props: { theme: sidebarRecipes.rowHeight } });
		expect(activeRow()).toContain('h-11');
		expect(activeRow().filter((c) => /^(h-control-|h-row-)/.test(c))).toEqual([]);
	});

	test('icon size: the prop alone scales the icons', () => {
		render(SidebarSurfaceHarness, { props: { iconSize: 'large' } });
		expect(panel()).toContain('[--sidebar-icon-size:var(--icon-size-lg)]');
		expect(panel()).not.toContain('[--sidebar-icon-size:var(--icon-size-md)]');
		// The row icon is sized by that variable, not by a token keyed on `size`.
		expect(activeRow()).toContain('[&_svg]:size-[var(--sidebar-icon-size)]');
		expect(activeRow().filter((c) => /size-icon-(sm|md|lg)$/.test(c))).toEqual([]);
	});
});
