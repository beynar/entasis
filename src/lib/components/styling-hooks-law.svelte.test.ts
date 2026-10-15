// Proposed law 12 (styling hooks, lane R1 · CX-6): every overlay and list exposes the shared state
// attributes (data-open, data-closed, data-entering, data-exiting, data-side, data-align,
// data-popup-open, data-highlighted, data-disabled, data-selected) and documented CSS variables,
// exported as typed maps. Each map's attributes are checked on the rendered parts in both
// states, and every name in a map is documented in its component's MCP description.
//
// `expectHook` records the names a test observed; the last test checks that every name in every
// map was observed, or is listed as one that only appears in a state jsdom cannot produce.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import StylingHooksHarness from './StylingHooksHarness.test.svelte';
import SidebarRowsHarness from './Sidebar/SidebarRowsHarness.test.svelte';
import {
	accordionCssVariables,
	accordionDataAttributes
} from './Accordion/accordion.attributes.js';
import { accordionDescription } from './Accordion/accordion.mcp.js';
import {
	collapsibleCssVariables,
	collapsibleDataAttributes
} from './Collapsible/collapsible.attributes.js';
import { collapsibleDescription } from './Collapsible/collapsible.mcp.js';
import { comboboxDataAttributes } from './Form/Combobox/combobox.attributes.js';
import { comboboxDescription } from './Form/Combobox/combobox.mcp.js';
import { dialogCssVariables, dialogDataAttributes } from './Dialog/dialog.attributes.js';
import { dialogDescription } from './Dialog/dialog.mcp.js';
import { hoverCardDataAttributes } from './HoverCard/hoverCard.attributes.js';
import { hoverCardDescription } from './HoverCard/hoverCard.mcp.js';
import { menuDataAttributes } from './Menu/menu.attributes.js';
import { menuDescription } from './Menu/menu.mcp.js';
import { overlayDataAttributes } from './Overlay/overlay.attributes.js';
import { overlayDescription } from './Overlay/overlay.mcp.js';
import { popoverCssVariables, popoverDataAttributes } from './Popover/popover.attributes.js';
import { popoverDescription } from './Popover/popover.mcp.js';
import { PANEL_CSS_VARIABLES } from './Popover/popover.position.js';
import { selectDataAttributes } from './Form/Select/select.attributes.js';
import { selectDescription } from './Form/Select/select.mcp.js';
import { sidebarCssVariables, sidebarDataAttributes } from './Sidebar/sidebar.attributes.js';
import { sidebarDescription } from './Sidebar/sidebar.mcp.js';
import { tooltipCssVariables, tooltipDataAttributes } from './Tooltip/tooltip.attributes.js';
import { tooltipDescription } from './Tooltip/tooltip.mcp.js';

const owners = {
	popover: { data: popoverDataAttributes, css: popoverCssVariables, doc: popoverDescription },
	dialog: { data: dialogDataAttributes, css: dialogCssVariables, doc: dialogDescription },
	tooltip: { data: tooltipDataAttributes, css: tooltipCssVariables, doc: tooltipDescription },
	hoverCard: { data: hoverCardDataAttributes, css: {}, doc: hoverCardDescription },
	menu: { data: menuDataAttributes, css: {}, doc: menuDescription },
	select: { data: selectDataAttributes, css: {}, doc: selectDescription },
	combobox: { data: comboboxDataAttributes, css: {}, doc: comboboxDescription },
	collapsible: {
		data: collapsibleDataAttributes,
		css: collapsibleCssVariables,
		doc: collapsibleDescription
	},
	accordion: {
		data: accordionDataAttributes,
		css: accordionCssVariables,
		doc: accordionDescription
	},
	overlay: { data: overlayDataAttributes, css: {}, doc: overlayDescription },
	sidebar: { data: sidebarDataAttributes, css: sidebarCssVariables, doc: sidebarDescription }
} as const;
type Owner = keyof typeof owners;

// Names that only appear in a state the jsdom scenarios below do not reach (a scrolled-out anchor,
// a shifted arrow, a tooltip handoff, a drawer, a mobile layout), or that are plain configuration
// echoes covered by each component's own tests. Each is still documented (checked below).
const unobserved: Record<Owner, readonly string[]> = {
	popover: ['data-anchor-hidden', 'data-uncentered'],
	dialog: ['data-type', 'data-modal'],
	tooltip: ['data-anchor-hidden', 'data-instant', 'data-color', 'data-size', 'data-variant'],
	hoverCard: ['data-anchor-hidden', 'data-state'],
	menu: ['data-size', 'data-density'],
	select: ['data-placeholder', 'data-readonly', 'data-popup-side'],
	combobox: ['data-popup-side', 'data-align'],
	collapsible: ['data-state', 'data-size', 'data-variant'],
	accordion: ['data-state', 'data-index', 'data-slot', 'data-size', 'data-density', 'data-variant'],
	overlay: ['data-show-on', 'data-position', 'data-entasis-overlay', 'data-overlay-content'],
	sidebar: [
		'data-entering',
		'data-state',
		'data-display-state',
		'data-collapsible',
		'data-side',
		'data-variant',
		'data-size',
		'data-density',
		'data-peek',
		'data-active',
		'data-active-variant',
		'data-popup-open',
		'data-sidebar'
	]
};

const observed = Object.fromEntries(
	Object.keys(owners).map((owner) => [owner, new Set<string>()])
) as Record<Owner, Set<string>>;

/** Asserts a hook on an element (`true`: present, `false`: absent, a string: that value). */
const expectHook = (
	owner: Owner,
	element: Element | null,
	name: string,
	state: boolean | string = true
) => {
	expect(Object.keys(owners[owner].data)).toContain(name);
	observed[owner].add(name);
	expect(element).not.toBeNull();
	if (state === false) expect(element).not.toHaveAttribute(name);
	else if (state === true) expect(element).toHaveAttribute(name);
	else expect(element).toHaveAttribute(name, state);
};

const mount = (
	scenario: Parameters<typeof StylingHooksHarness>[1]['scenario'],
	open?: boolean,
	duration?: number
) => render(StylingHooksHarness, { props: { scenario, open, duration } });
/** What `elements` carried while they played their exit, until they left the document. */
const recordExit = async (elements: Element[], close: () => unknown) => {
	const seen = elements.map(() => ({ closed: false, exiting: false, openWhileExiting: false }));
	const observer = new MutationObserver(() => {
		elements.forEach((element, index) => {
			if (element.hasAttribute('data-closed')) seen[index].closed = true;
			if (element.hasAttribute('data-exiting')) {
				seen[index].exiting = true;
				if (element.hasAttribute('data-open')) seen[index].openWhileExiting = true;
			}
		});
	});
	for (const element of elements) observer.observe(element, { attributes: true });
	await close();
	await waitFor(() => expect(elements.every((element) => !element.isConnected)).toBe(true));
	observer.disconnect();
	return seen;
};
const exited = { closed: true, exiting: true, openWhileExiting: false };

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const pressOutside = () => fireEvent.pointerDown(screen.getByTestId('outside'));

describe('law 12 · styling hooks (R1 · CX-6)', () => {
	test('the panel reports its state and the trigger data-popup-open', async () => {
		mount('popover');
		const trigger = button('Open popover');
		expectHook('popover', trigger, 'data-popup-open', false);
		await fireEvent.click(trigger);
		const panel = (await screen.findByRole('button', { name: 'Inside popover' })).parentElement;
		expectHook('popover', panel, 'data-open');
		expectHook('popover', panel, 'data-closed', false);
		expectHook('popover', trigger, 'data-popup-open', '');
		await waitFor(() => expectHook('popover', panel, 'data-side', 'bottom'));
		expectHook('popover', panel, 'data-align', 'center');
		expectHook('popover', panel, 'data-entering', false);
		expectHook('popover', panel, 'data-exiting', false);
		expectHook('popover', trigger, 'data-popup-side', 'bottom');
		expect(panel!.querySelector('[aria-hidden="true"]')).toHaveAttribute('data-side', 'bottom');

		await pressOutside();
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull()
		);
		expectHook('popover', trigger, 'data-popup-open', false);
	});

	test('the closing panel carries data-closed and data-exiting', async () => {
		mount('popover', false, 150);
		const trigger = button('Open popover');
		await fireEvent.click(trigger);
		const panel = screen.getByRole('button', { name: 'Inside popover' }).parentElement!;
		// The enter transition is still playing in the flush that opened it.
		expectHook('popover', panel, 'data-entering');
		expectHook('popover', panel, 'data-open');
		await waitFor(() => expectHook('popover', panel, 'data-entering', false));
		expect(await recordExit([panel], () => fireEvent.click(trigger))).toEqual([exited]);
		expectHook('popover', panel, 'data-closed');
		observed.popover.add('data-exiting');
	});

	test('the closing dialog root and panel carry data-closed and data-exiting', async () => {
		mount('dialog', false, 150);
		await fireEvent.click(button('Open dialog'));
		const root = await screen.findByRole('dialog');
		const panel = screen.getByRole('button', { name: 'Inside dialog' }).closest('[data-type]')!;
		await waitFor(() => expectHook('dialog', panel, 'data-entering', false));
		const seen = await recordExit([root, panel], () =>
			fireEvent.keyDown(window, { key: 'Escape' })
		);
		expect(seen).toEqual([exited, exited]);
	});

	test('the closing tooltip surface carries data-closed and data-exiting', async () => {
		const { rerender } = mount('tooltip', true, 150);
		const surface = await screen.findByRole('tooltip');
		await waitFor(() => expectHook('tooltip', surface, 'data-entering', false));
		const seen = await recordExit([surface], () =>
			rerender({ scenario: 'tooltip', open: false, duration: 150 })
		);
		expect(seen).toEqual([exited]);
	});

	test('the Popover CSS variable map is the set a placement writes', () => {
		expect(Object.keys(popoverCssVariables).sort()).toEqual([...PANEL_CSS_VARIABLES].sort());
	});

	test('the root, panel, backdrop and trigger report the open state', async () => {
		mount('dialog');
		const trigger = button('Open dialog');
		expectHook('dialog', trigger, 'data-popup-open', false);
		await fireEvent.click(trigger);
		const root = await screen.findByRole('dialog');
		const panel = screen.getByRole('button', { name: 'Inside dialog' }).closest('[data-type]')!;
		expect(panel).not.toBe(root);
		for (const part of [root, panel]) {
			expectHook('dialog', part, 'data-open');
			expectHook('dialog', part, 'data-closed', false);
			expectHook('dialog', part, 'data-exiting', false);
		}
		await waitFor(() => expectHook('dialog', root, 'data-entering', false));
		expectHook('dialog', trigger, 'data-popup-open', '');
		expectHook('dialog', document.documentElement, 'data-dialog-open');
		expect(document.documentElement.style.getPropertyValue('--dialog-depth')).toBe('1');
		const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0 > div');
		expectHook('dialog', backdrop, 'data-open');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expectHook('dialog', trigger, 'data-popup-open', false);
		expectHook('dialog', document.documentElement, 'data-dialog-open', false);
		observed.dialog.add('data-closed');
	});

	test('the surface carries the panel state and the trigger data-popup-open', async () => {
		const { rerender } = mount('tooltip', false);
		const trigger = button('Hint');
		expectHook('tooltip', trigger, 'data-popup-open', false);
		await rerender({ scenario: 'tooltip', open: true });
		const surface = await screen.findByRole('tooltip');
		expectHook('tooltip', surface, 'data-open');
		expectHook('tooltip', surface, 'data-closed', false);
		expectHook('tooltip', trigger, 'data-popup-open', '');
		await waitFor(() => expectHook('tooltip', surface, 'data-side'));
		expectHook('tooltip', surface, 'data-align', 'center');
		await waitFor(() => expectHook('tooltip', surface, 'data-entering', false));
		expectHook('tooltip', surface, 'data-exiting', false);
		expectHook('tooltip', trigger, 'data-popup-side', surface.getAttribute('data-side')!);

		await rerender({ scenario: 'tooltip', open: false });
		await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
		expectHook('tooltip', trigger, 'data-popup-open', false);
		observed.tooltip.add('data-closed');
	});

	test('the card and its trigger report the open state', async () => {
		const { rerender } = mount('hover-card', false);
		const trigger = button('Card trigger');
		expectHook('hoverCard', trigger, 'data-popup-open', false);
		expectHook('hoverCard', trigger, 'data-disabled', false);
		await rerender({ scenario: 'hover-card', open: true });
		const card = (await screen.findByText('Card body')).closest('[data-open]');
		expectHook('hoverCard', card, 'data-open');
		expectHook('hoverCard', card, 'data-closed', false);
		await waitFor(() => expectHook('hoverCard', card, 'data-side', 'bottom'));
		expectHook('hoverCard', card, 'data-align', 'center');
		await waitFor(() => expectHook('hoverCard', card, 'data-entering', false));
		expectHook('hoverCard', card, 'data-exiting', false);
		expectHook('hoverCard', trigger, 'data-popup-open', '');
		expectHook('hoverCard', trigger, 'data-popup-side', 'bottom');
		observed.hoverCard.add('data-closed');
	});

	test('rows report highlight, disabled and checked; submenu rows their popup', async () => {
		mount('popup-menu');
		const trigger = button('Actions');
		await fireEvent.click(trigger);
		const archive = await screen.findByRole('menuitem', { name: 'Archive' });
		const panel = archive.closest('[data-side]');
		expectHook('menu', panel, 'data-open');
		expectHook('menu', panel, 'data-closed', false);
		await waitFor(() => expectHook('menu', panel, 'data-entering', false));
		expectHook('menu', panel, 'data-exiting', false);
		await waitFor(() => expectHook('menu', panel, 'data-side', 'bottom'));
		expectHook('menu', panel, 'data-align');
		expectHook('menu', screen.getByRole('menuitem', { name: 'Delete' }), 'data-disabled');
		expectHook('menu', archive, 'data-disabled', false);
		expectHook('menu', screen.getByRole('menuitemcheckbox', { name: 'Pinned' }), 'data-selected');
		expectHook('menu', archive, 'data-selected', false);
		await fireEvent.keyDown(archive.closest('[role="menu"]')!, { key: 'ArrowDown' });
		await waitFor(() =>
			expect(document.querySelector('[role="menu"] [data-highlighted]')).not.toBeNull()
		);
		expectHook(
			'menu',
			document.querySelector('[role="menu"] [data-highlighted]'),
			'data-highlighted'
		);

		const submenuRow = screen.getByRole('menuitem', { name: 'Move to' });
		expectHook('menu', submenuRow, 'data-popup-open', false);
		await fireEvent.click(submenuRow);
		await screen.findByRole('menuitem', { name: 'Inbox' });
		expectHook('menu', submenuRow, 'data-popup-open', '');
		await waitFor(() => expectHook('menu', submenuRow, 'data-popup-side'));
		observed.menu.add('data-closed');
	});

	test('the trigger, its container, the list and the options report their state', async () => {
		const { rerender } = mount('select', false);
		const trigger = screen.getByRole('combobox', { name: 'Plan' });
		expectHook('select', trigger, 'data-popup-open', false);
		expectHook('select', trigger, 'data-disabled', false);
		await rerender({ scenario: 'select', open: true });
		await screen.findByRole('listbox');
		expectHook('select', trigger, 'data-popup-open', '');
		expectHook('select', trigger.parentElement, 'data-popup-open', '');
		const team = screen.getByRole('option', { name: 'Team' });
		const pro = screen.getByRole('option', { name: 'Pro' });
		expectHook('select', team, 'data-disabled', '');
		expectHook('select', pro, 'data-disabled', false);
		expectHook('select', pro, 'data-selected');
		expectHook('select', team, 'data-selected', false);
		await waitFor(() => expectHook('select', pro, 'data-highlighted'));
		const panel = screen.getByRole('listbox').closest('[data-open]');
		expectHook('select', panel, 'data-open');
		expectHook('select', panel, 'data-closed', false);
		await waitFor(() => expectHook('select', panel, 'data-entering', false));
		expectHook('select', panel, 'data-exiting', false);
		await waitFor(() => expectHook('select', panel, 'data-side'));

		await rerender({ scenario: 'select', open: false });
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
		expectHook('select', trigger, 'data-popup-open', false);
		observed.select.add('data-closed');
	});

	test('the input, the list and the options report their state', async () => {
		const { rerender } = mount('combobox', false);
		const input = screen.getByRole('combobox', { name: 'Plan' });
		expectHook('combobox', input, 'data-popup-open', false);
		expectHook('combobox', input, 'data-disabled', false);
		await rerender({ scenario: 'combobox', open: true });
		await screen.findByRole('listbox');
		expectHook('combobox', input, 'data-popup-open', '');
		const team = screen.getByRole('option', { name: 'Team' });
		const free = screen.getByRole('option', { name: 'Free' });
		const pro = screen.getByRole('option', { name: 'Pro' });
		expectHook('combobox', team, 'data-disabled', '');
		expectHook('combobox', free, 'data-disabled', false);
		expectHook('combobox', pro, 'data-selected');
		expectHook('combobox', free, 'data-selected', false);
		input.focus();
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		const listbox = screen.getByRole('listbox');
		await waitFor(() =>
			expectHook(
				'combobox',
				listbox.querySelector('[role="option"][data-highlighted]'),
				'data-highlighted'
			)
		);
		const panel = screen.getByRole('listbox').closest('[data-open]');
		expectHook('combobox', panel, 'data-open');
		expectHook('combobox', panel, 'data-closed', false);
		await waitFor(() => expectHook('combobox', panel, 'data-entering', false));
		expectHook('combobox', panel, 'data-exiting', false);
		await waitFor(() => expectHook('combobox', panel, 'data-side', 'bottom'));
		observed.combobox.add('data-closed');
	});

	test('the root, trigger, panel and content report the open state', async () => {
		mount('collapsible');
		const trigger = button('Details');
		const root = trigger.parentElement!;
		for (const part of [root, trigger]) {
			expectHook('collapsible', part, 'data-closed');
			expectHook('collapsible', part, 'data-open', false);
			expectHook('collapsible', part, 'data-disabled', false);
		}
		await fireEvent.click(trigger);
		const content = (await screen.findByText('Collapsible body')).parentElement!;
		const panel = content.parentElement!;
		for (const part of [root, trigger, panel, content]) {
			expectHook('collapsible', part, 'data-open');
			expectHook('collapsible', part, 'data-closed', false);
		}
		await waitFor(() => expectHook('collapsible', panel, 'data-entering', false));
		expectHook('collapsible', root, 'data-exiting', false);
		expect(panel.style.getPropertyValue('--disclosure-panel-height')).toBe('auto');
	});

	test('items, triggers and panels report their own state', async () => {
		mount('accordion');
		const first = button('First');
		const second = button('Second');
		expectHook('accordion', first, 'data-closed');
		expectHook('accordion', first.closest('[data-slot="accordion-item"]'), 'data-closed');
		expectHook('accordion', second, 'data-disabled');
		expectHook('accordion', first, 'data-disabled', false);
		await fireEvent.click(first);
		expectHook('accordion', first, 'data-open');
		expectHook('accordion', first.closest('[data-slot="accordion-item"]'), 'data-open');
		const panel = document.getElementById(first.getAttribute('aria-controls')!)!;
		expectHook('accordion', panel, 'data-open');
		await waitFor(() => expectHook('accordion', panel, 'data-entering', false));
		expectHook('accordion', panel, 'data-exiting', false);
		expect(panel.style.getPropertyValue('--disclosure-panel-height')).toBe('auto');
	});

	test('data-open is a presence attribute, data-closed marks the closed state', async () => {
		const { rerender, container } = mount('overlay', false);
		const root = container.querySelector('[data-entasis-overlay]');
		expectHook('overlay', root, 'data-closed', '');
		expectHook('overlay', root, 'data-open', false);
		await rerender({ scenario: 'overlay', open: true });
		expectHook('overlay', root, 'data-open', '');
		expectHook('overlay', root, 'data-closed', false);
		await settle();
		expectHook('overlay', root, 'data-entering', false);
		expectHook('overlay', root, 'data-exiting', false);
	});

	test('disclosure toggles carry presence data-open and data-closed', async () => {
		render(SidebarRowsHarness, {
			props: {
				items: [
					{ label: 'Projects', collapsible: true, items: [{ label: 'Atlas', href: '#atlas' }] },
					{
						label: 'Pages',
						items: [{ label: 'Planning', items: [{ label: 'Roadmap', href: '#roadmap' }] }]
					}
				]
			}
		});
		const group = button('Projects');
		expectHook('sidebar', group, 'data-open', '');
		await fireEvent.click(group);
		expectHook('sidebar', group, 'data-closed', '');
		expectHook('sidebar', group, 'data-open', false);
		const panel = document.getElementById(group.getAttribute('aria-controls')!);
		expectHook('sidebar', panel, 'data-exiting');
		// Reopened mid-collapse: the open state follows at once (the panel's enter phase is the
		// shared disclosure panel's, covered in attachments/disclosurePanel.svelte.test.ts).
		await fireEvent.click(group);
		expectHook('sidebar', group, 'data-open', '');

		const planning = button('Planning');
		expectHook('sidebar', planning, 'data-closed', '');
		await fireEvent.click(planning);
		expectHook('sidebar', planning, 'data-open', '');
		const submenu = document.getElementById(planning.getAttribute('aria-controls')!);
		expect(submenu?.style.getPropertyValue('--disclosure-panel-height')).not.toBe('');
	});

	test('every name in every map is observed above or listed as unobserved', () => {
		for (const [owner, { data }] of Object.entries(owners) as [Owner, (typeof owners)[Owner]][]) {
			const missing = Object.keys(data).filter(
				(name) => !observed[owner].has(name) && !unobserved[owner].includes(name)
			);
			expect(missing, owner).toEqual([]);
		}
	});
});

describe('law 12 · the styling-hook maps are documented', () => {
	test.each(Object.entries(owners))('%s documents every attribute and variable', (_, owner) => {
		for (const name of [...Object.keys(owner.data), ...Object.keys(owner.css)]) {
			expect(owner.doc, name).toContain(`\`${name}\``);
		}
	});
});
