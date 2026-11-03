// Selectable timeline: each item gets a stretched toggle button (`aria-pressed`) named by its
// title. The value is the item's `id` (else its index) and follows value / defaultValue /
// onValueChange. The buttons share one roving tab stop moved by the arrows of the orientation,
// Home and End; Enter and Space select. A timeline that is not selectable renders no button.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Timeline from './Timeline.svelte';
import type { TimelineItem } from './timeline.props.js';
import TimelineSelectionHarness from './TimelineSelectionHarness.test.svelte';

const steps: TimelineItem[] = [
	{ id: 'opened', title: 'Opened', progress: 'done' },
	{ id: 'documents', title: 'Documents', progress: 'done' },
	{ id: 'appraisal', title: 'Appraisal', progress: 'current' },
	{ id: 'report', title: 'Report', progress: 'upcoming' }
];

const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot="timeline-item"]')];
const buttons = () => [
	...document.querySelectorAll<HTMLButtonElement>('[data-slot="timeline-item-button"]')
];
const button = (name: string) => screen.getByRole('button', { name });
const tabStops = () => buttons().filter((node) => node.tabIndex === 0);
const value = () => screen.getByTestId('value').textContent;
const changes = () => screen.getByTestId('changes').textContent;
const classesOf = (element: Element | null) => element?.getAttribute('class')?.split(/\s+/) ?? [];
const content = (row: HTMLElement) =>
	row.querySelector<HTMLElement>('[data-slot="timeline-content"]')!;

const press = async (key: string) => {
	const target = document.activeElement as HTMLElement;
	await fireEvent.keyDown(target, { key });
	flushSync();
};

describe('Timeline selection', () => {
	test('a timeline that is not selectable renders no button and no selection hooks', () => {
		renderInTheme(Timeline, { items: steps, value: 'opened', defaultValue: 'opened' });
		expect(buttons()).toHaveLength(0);
		expect(screen.queryAllByRole('button')).toHaveLength(0);
		for (const row of rows()) {
			expect(row).not.toHaveAttribute('data-selected');
			expect(row).not.toHaveAttribute('data-disabled');
			expect(row.querySelector('[id]')).toBeNull();
			expect(classesOf(content(row))).not.toContain('pointer-events-none');
			expect(classesOf(content(row))).not.toContain('state-layer');
		}
	});

	test('a11y:timeline.selection-pressed each item is a toggle button named by its title, pressed when selected', () => {
		renderInTheme(Timeline, { items: steps, selectable: true, defaultValue: 'documents' });
		expect(buttons().map((node) => node.getAttribute('aria-pressed'))).toEqual([
			'false',
			'true',
			'false',
			'false'
		]);
		const documents = button('Documents');
		expect(documents).toHaveAttribute('type', 'button');
		const title = document.getElementById(documents.getAttribute('aria-labelledby')!);
		expect(title).toHaveTextContent('Documents');
		expect(rows().map((row) => row.hasAttribute('data-selected'))).toEqual([
			false,
			true,
			false,
			false
		]);
		// The current step stays `aria-current="step"`; selection never borrows it.
		expect(rows()[2]).toHaveAttribute('aria-current', 'step');
		expect(button('Appraisal')).toHaveAttribute('aria-current', 'step');
		expect(rows()[1]).not.toHaveAttribute('aria-current');
	});

	test('a click selects, reports { value, item, index } once, and re-selecting is silent', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Timeline, { items: steps, selectable: true, onValueChange });
		expect(buttons().every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true);

		await fireEvent.click(button('Report'));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'report',
			item: steps[3],
			index: 3
		});
		expect(button('Report')).toHaveAttribute('aria-pressed', 'true');

		await fireEvent.click(button('Report'));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(button('Report')).toHaveAttribute('aria-pressed', 'true');
	});

	test('bind:value writes the selection back, and an outside change selects silently', async () => {
		const { rerender } = renderInTheme(TimelineSelectionHarness, { items: steps });
		await fireEvent.click(button('Opened'));
		expect(value()).toBe('opened');
		expect(changes()).toBe('opened@0');

		await rerender({ items: steps, value: 'appraisal' });
		expect(button('Appraisal')).toHaveAttribute('aria-pressed', 'true');
		expect(button('Opened')).toHaveAttribute('aria-pressed', 'false');
		expect(changes()).toBe('opened@0');

		await rerender({ items: steps, value: 'missing' });
		expect(buttons().every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true);
	});

	test('an item without an id is selected by its index', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Timeline, {
			items: [{ title: 'One' }, { title: 'Two' }],
			selectable: true,
			defaultValue: 1,
			onValueChange
		});
		expect(button('Two')).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(button('One'));
		expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ value: 0, index: 0 }));
	});

	test('an index fallback that collides with a numeric id throws', () => {
		expect(() =>
			renderInTheme(Timeline, {
				items: [{ title: 'One' }, { id: 0, title: 'Zero' }],
				selectable: true
			})
		).toThrow(/index 0 has no ID/);
		// Not selectable: no selection value, nothing to collide.
		expect(() =>
			renderInTheme(Timeline, { items: [{ title: 'One' }, { id: 0, title: 'Zero' }] })
		).not.toThrow();
	});

	test('a disabled item is a disabled button that never selects', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Timeline, {
			items: [steps[0]!, { ...steps[1]!, disabled: true }, steps[2]!],
			selectable: true,
			onValueChange
		});
		expect(button('Documents')).toBeDisabled();
		expect(rows()[1]).toHaveAttribute('data-disabled', '');
		expect(classesOf(content(rows()[1]!))).not.toContain('state-layer');
		await fireEvent.click(button('Documents'));
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('Timeline selection keyboard', () => {
	test('a11y:timeline.selection-roving one tab stop: the selected item, else the current step, else the first enabled item', async () => {
		const { rerender } = renderInTheme(TimelineSelectionHarness, { items: steps });
		flushSync();
		expect(tabStops()).toEqual([button('Appraisal')]);

		await rerender({ items: steps, value: 'documents' });
		expect(tabStops()).toEqual([button('Documents')]);

		const plain: TimelineItem[] = [
			{ id: 'a', title: 'Alpha', disabled: true },
			{ id: 'b', title: 'Beta' },
			{ id: 'c', title: 'Gamma' }
		];
		await rerender({ items: plain, value: undefined });
		expect(tabStops()).toEqual([button('Beta')]);
	});

	test('horizontal: Left/Right move focus, Up/Down do not, Home/End jump; focus never selects', async () => {
		renderInTheme(TimelineSelectionHarness, { items: steps });
		flushSync();
		button('Appraisal').focus();

		await press('ArrowRight');
		expect(document.activeElement).toBe(button('Report'));
		await press('ArrowDown');
		expect(document.activeElement).toBe(button('Report'));
		await press('ArrowLeft');
		await press('ArrowLeft');
		expect(document.activeElement).toBe(button('Documents'));
		await press('Home');
		expect(document.activeElement).toBe(button('Opened'));
		await press('End');
		expect(document.activeElement).toBe(button('Report'));
		expect(tabStops()).toEqual([button('Report')]);
		expect(changes()).toBe('');
	});

	test('vertical: Up/Down move focus, Left/Right do not', async () => {
		renderInTheme(TimelineSelectionHarness, { items: steps, orientation: 'vertical' });
		flushSync();
		button('Appraisal').focus();
		await press('ArrowDown');
		expect(document.activeElement).toBe(button('Report'));
		await press('ArrowRight');
		expect(document.activeElement).toBe(button('Report'));
		await press('ArrowUp');
		await press('ArrowUp');
		expect(document.activeElement).toBe(button('Documents'));
	});

	test('Enter and Space select the focused item', async () => {
		renderInTheme(TimelineSelectionHarness, { items: steps });
		flushSync();
		button('Appraisal').focus();
		await press('ArrowRight');
		await press('Enter');
		expect(value()).toBe('report');
		await press('Home');
		await press(' ');
		expect(value()).toBe('opened');
		expect(changes()).toBe('report@3,opened@0');
	});

	test('arrows skip a disabled item', async () => {
		renderInTheme(TimelineSelectionHarness, {
			items: [steps[0]!, { ...steps[1]!, disabled: true }, steps[2]!]
		});
		flushSync();
		button('Opened').focus();
		await press('ArrowRight');
		expect(document.activeElement).toBe(button('Appraisal'));
	});

	test('the tab stop follows its item through a reorder and an insertion', async () => {
		const { rerender } = renderInTheme(TimelineSelectionHarness, {
			items: steps,
			value: 'documents'
		});
		flushSync();
		expect(tabStops()).toEqual([button('Documents')]);

		const reordered = [steps[3]!, steps[1]!, steps[0]!, steps[2]!];
		await rerender({ items: reordered, value: 'documents' });
		flushSync();
		expect(tabStops()).toEqual([button('Documents')]);
		expect(buttons()[1]).toBe(button('Documents'));

		const inserted = [{ id: 'new', title: 'Intake' }, ...reordered];
		await rerender({ items: inserted, value: 'documents' });
		flushSync();
		expect(tabStops()).toEqual([button('Documents')]);
	});
});

describe('Timeline selection with an item snippet', () => {
	test('the snippet names the button through titleId, reads selected and can select()', async () => {
		renderInTheme(TimelineSelectionHarness, { items: steps, custom: true });
		flushSync();
		const titles = screen.getAllByTestId('custom-title');
		const selectButtons = buttons();
		expect(selectButtons.map((node) => node.getAttribute('aria-labelledby'))).toEqual(
			titles.map((title) => title.id)
		);
		expect(button('Report')).toBe(selectButtons[3]);

		await fireEvent.click(selectButtons[3]!);
		expect(value()).toBe('report');
		expect(screen.getAllByTestId('custom-state')[3]).toHaveTextContent('selected');

		await fireEvent.click(screen.getAllByTestId('custom-select')[0]!);
		expect(value()).toBe('opened');
		expect(changes()).toBe('report@3,opened@0');
	});

	test('the selection button never wraps the content', () => {
		renderInTheme(TimelineSelectionHarness, { items: steps, custom: true });
		for (const node of buttons()) {
			expect(node).toBeEmptyDOMElement();
			expect(node.parentElement?.dataset.slot).toBe('timeline-item');
		}
	});
});

describe('Timeline selection styling', () => {
	test.each(['ghost', 'card', 'outline', 'soft'] as const)(
		'%s: the selected surface paints the selected recipe and the title follows it',
		(variant) => {
			renderInTheme(Timeline, {
				items: steps,
				variant,
				selectable: true,
				defaultValue: 'opened'
			});
			const [selected, idle] = rows();
			expect(classesOf(content(selected!))).toEqual(
				expect.arrayContaining(['bg-selected-muted', 'text-selected-muted-readable'])
			);
			expect(classesOf(content(idle!))).not.toContain('bg-selected-muted');
			const title = document.getElementById(button('Opened').getAttribute('aria-labelledby')!);
			expect(classesOf(title)).toContain('text-selected-muted-readable');
			if (variant !== 'ghost') {
				expect(classesOf(content(selected!))).toEqual(
					expect.arrayContaining(['ring-2', 'ring-selected'])
				);
			}
			for (const row of rows()) {
				expect(classesOf(content(row))).toEqual(
					expect.arrayContaining([
						'state-layer',
						'pointer-events-none',
						'peer-focus-visible/timeline-item-button:ring-focus/50'
					])
				);
			}
		}
	);
});
