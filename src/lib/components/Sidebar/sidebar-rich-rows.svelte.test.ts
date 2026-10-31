// A menu entry may lead with `media` instead of an icon, carry a `description` under its label and
// a `meta` at the end of the label's line: a conversation list built as data. Geometry is measured
// in the browser (`sidebar-rich-rows.browser.test.ts`); these pin the structure.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SidebarRichRowHarness from './SidebarRichRowHarness.test.svelte';

const link = (name: string) => screen.getByRole('link', { name: new RegExp(name) });
const slot = (row: HTMLElement, name: string) =>
	row.querySelector<HTMLElement>(`[data-slot="sidebar-menu-${name}"]`);

describe('rich menu rows', () => {
	test('a row reads its label, meta and description, in that order', () => {
		render(SidebarRichRowHarness);
		const row = link('Ada');
		expect(slot(row, 'label')).toHaveTextContent('Ada');
		expect(slot(row, 'meta')).toHaveTextContent('10:42');
		expect(slot(row, 'description')).toHaveTextContent('The report is ready');
		expect(row).toHaveAccessibleName(/^Ada\s*10:42\s*The report is ready/);
	});

	test('description and meta accept snippets', () => {
		render(SidebarRichRowHarness);
		const row = link('Brune');
		expect(slot(row, 'meta')?.querySelector('time')).toHaveTextContent('Hier');
		expect(slot(row, 'description')?.querySelector('em')).toHaveTextContent('Typing…');
	});

	test('media replaces the icon, inside the row, and receives the API and its entry', () => {
		const onmediaentry = vi.fn();
		render(SidebarRichRowHarness, { props: { onmediaentry } });
		const row = link('Ada');
		const media = slot(row, 'media');
		expect(media).toContainElement(screen.getAllByTestId('face')[0]);
		expect(media).toHaveAttribute('data-sidebar', 'menu-media');
		const labels = onmediaentry.mock.calls.map(([, entry]) => entry.label);
		expect(labels).toEqual(expect.arrayContaining(['Ada', 'Brune', 'Cyrus']));
		expect(onmediaentry.mock.calls[0]?.[0].displayState).toBe('expanded');
	});

	test('a description gives the row the large height; a meta alone does not', () => {
		render(SidebarRichRowHarness);
		expect(link('Ada')).toHaveAttribute('data-size', 'large');
		expect(link('Ada')).toHaveClass('h-14');
		expect(link('Réglages')).toHaveAttribute('data-size', 'normal');
		expect(link('Réglages')).toHaveClass('h-control-lg');
		expect(slot(link('Réglages'), 'meta')).toHaveTextContent('Hier');
	});

	test('isActive, suffix and href keep their behaviour', () => {
		render(SidebarRichRowHarness);
		const row = link('Ada');
		expect(row).toHaveAttribute('aria-current', 'page');
		expect(row).toHaveAttribute('href', '#ada');
		expect(row).toHaveAccessibleDescription('');
		const suffix = document.getElementById(row.getAttribute('aria-describedby') ?? '');
		expect(suffix).toContainElement(screen.getByTestId('dot'));
		expect(row).not.toContainElement(suffix);
	});

	test('a plain row keeps its single label span', () => {
		render(SidebarRichRowHarness);
		const row = link('Plain');
		expect(slot(row, 'text')).toBeNull();
		expect(row).not.toHaveClass('h-row-lg');
	});

	test('a sub entry carries media, meta and description, at the two-line height', () => {
		render(SidebarRichRowHarness);
		const row = link('Cyrus');
		expect(row).toHaveAttribute('data-sidebar', 'menu-sub-button');
		expect(slot(row, 'media')).not.toBeNull();
		expect(slot(row, 'meta')).toHaveTextContent('09:15');
		expect(slot(row, 'description')).toHaveTextContent('On it.');
		expect(row).toHaveClass('h-row-lg');
	});

	test('collapsed to icons, media keeps the row eligible and visible; meta is left out', () => {
		render(SidebarRichRowHarness, { props: { displayState: 'collapsed' } });
		const root = document.querySelector('[data-collapsible]');
		expect(root).toHaveAttribute('data-collapsible', 'icon');
		const row = link('Ada');
		expect(slot(row, 'media')).not.toBeNull();
		expect(slot(row, 'meta')).toBeNull();
		expect(slot(row, 'description')).not.toBeNull();
	});
});
