import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import Command from './Command/Command.svelte';
import SelectionLawHarness from './SelectionLawHarness.test.svelte';
import Tabbar from './Tabbar/Tabbar.svelte';
import ToggleButton from './ToggleButton/ToggleButton.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
const scrollTo = Element.prototype.scrollTo;

beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	Element.prototype.scrollTo = vi.fn();
});

afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	Element.prototype.scrollTo = scrollTo;
});

describe('selection contract', () => {
	test.each(['ai-tool-single', 'ai-tool-group'] as const)(
		'%s forwards expansion state once',
		async (scenario) => {
			const onValueChange = vi.fn();
			render(SelectionLawHarness, { props: { scenario, onValueChange } });
			const trigger = screen.getByRole('button', { expanded: true });
			expect(onValueChange).not.toHaveBeenCalled();
			await fireEvent.click(trigger);
			expect(onValueChange).toHaveBeenCalledExactlyOnceWith([]);
			await fireEvent.click(trigger);
			expect(onValueChange).toHaveBeenCalledTimes(2);
			expect(onValueChange).toHaveBeenLastCalledWith(['lookup']);
		}
	);

	test('distinguishes suggestion activation from a selection state change', async () => {
		const onValueChange = vi.fn();
		const onSelect = vi.fn();
		render(SelectionLawHarness, {
			props: { scenario: 'ai-suggestions', onValueChange, onSelect }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Summarize' }));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('Summarize');
		await fireEvent.click(screen.getByRole('button', { name: 'Explain' }));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Explain');
		expect(onSelect).toHaveBeenCalledTimes(2);
	});

	test('uses a toggle default once and keeps later external changes silent', async () => {
		const onValueChange = vi.fn();
		const { rerender } = render(ToggleButton, {
			props: { label: 'Uncontrolled toggle', defaultValue: true, onValueChange }
		});
		const button = screen.getByRole('button', { name: 'Uncontrolled toggle' });
		await rerender({ label: 'Uncontrolled toggle', defaultValue: false, onValueChange });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.click(button);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(false);
		await rerender({ label: 'Uncontrolled toggle', defaultValue: true, onValueChange });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(onValueChange).toHaveBeenCalledOnce();
	});

	test('updates a bound toggle once and keeps parent updates silent', async () => {
		const onValueChange = vi.fn();
		render(SelectionLawHarness, { props: { scenario: 'toggle', onValueChange } });
		await fireEvent.click(screen.getByRole('button', { name: 'Bound toggle' }));
		expect(screen.getByRole('status')).toHaveTextContent('true');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(true);
		await fireEvent.click(screen.getByRole('button', { name: 'External reset' }));
		expect(screen.getByRole('button', { name: 'Bound toggle' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect(onValueChange).toHaveBeenCalledOnce();
	});

	test('preserves an uncontrolled edit when its callback immediately updates spread props', async () => {
		const onValueChange = vi.fn();
		render(SelectionLawHarness, { props: { scenario: 'toggle-spread', onValueChange } });
		const button = screen.getByRole('button', { name: 'Spread toggle' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(button).toHaveClass('updated-during-callback');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	test('coordinates Tabbar and Stepper without duplicate Tabs callbacks', async () => {
		const onValueChange = vi.fn();
		render(SelectionLawHarness, { props: { scenario: 'tabs', onValueChange } });
		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Settings',
			item: 'Settings',
			index: 1
		});
		expect(screen.getByRole('status')).toHaveTextContent('Settings');
		await fireEvent.click(screen.getByRole('button', { name: 'Go to first panel' }));
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange).toHaveBeenLastCalledWith({
			value: 'Overview',
			item: 'Overview',
			index: 0
		});
		await fireEvent.click(screen.getByRole('button', { name: 'External tab change' }));
		expect(screen.getByRole('status')).toHaveTextContent('Settings');
		expect(onValueChange).toHaveBeenCalledTimes(2);
	});

	test('Command keeps its selected value distinct from activation', async () => {
		const onValueChange = vi.fn();
		const onSelect = vi.fn();
		render(Command, {
			props: {
				items: [
					{
						items: [
							{ value: 'open', label: 'Open' },
							{ value: 'close', label: 'Close' }
						]
					}
				],
				onValueChange,
				onSelect
			}
		});

		await fireEvent.click(screen.getByRole('option', { name: 'Open' }));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('open');
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('open');

		await fireEvent.click(screen.getByRole('option', { name: 'Open' }));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onSelect).toHaveBeenCalledTimes(2);

		await fireEvent.click(screen.getByRole('option', { name: 'Close' }));
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange).toHaveBeenLastCalledWith('close');
	});

	test('keeps externally controlled Accordion changes silent', async () => {
		const onValueChange = vi.fn();
		render(SelectionLawHarness, { props: { scenario: 'accordion', onValueChange } });
		expect(screen.getByRole('button', { name: 'First section' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'External accordion change' }));
		expect(screen.getByRole('button', { name: 'Second section' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Second section' }));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([]);
	});

	test('honors Sidebar defaultOpen and emits no callbacks for repeated or external changes', async () => {
		const onOpenChange = vi.fn();
		const onDisplayStateChange = vi.fn();
		render(SelectionLawHarness, {
			props: { scenario: 'sidebar', defaultOpen: false, onOpenChange, onDisplayStateChange }
		});
		expect(screen.getByRole('status')).toHaveTextContent('false');
		await fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(onDisplayStateChange).toHaveBeenCalledExactlyOnceWith('expanded');
		await fireEvent.click(screen.getByRole('button', { name: 'External sidebar change' }));
		expect(screen.getByRole('status')).toHaveTextContent('false');
		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onDisplayStateChange).toHaveBeenCalledOnce();
	});

	// Selection has exactly two public callback names: `onSelect` for the event of picking one item
	// and `onSelectionChange` for a selection-model state change. Qualified spellings
	// (`onSuggestionSelect`, `onSlotSelect`, `onMenuSelect`, `onPick`, ...) drift apart across
	// components, so the props files may not reintroduce them.
	test('public props declare no selection callback outside onSelect and onSelectionChange', () => {
		const propsFiles = import.meta.glob('./**/*.props.ts', {
			query: '?raw',
			import: 'default',
			eager: true
		}) as Record<string, string>;
		const entries = Object.entries(propsFiles);
		expect(entries.length).toBeGreaterThan(50);

		const callback = /\bon[A-Za-z]*(?:Select|Pick|Choose)[A-Za-z]*(?=\??\s*[:(])/g;
		const offenders = entries.flatMap(([file, source]) =>
			[...source.matchAll(callback)]
				.map((match) => match[0])
				.filter((name) => name !== 'onSelect' && name !== 'onSelectionChange')
				.map((name) => `${file}: ${name}`)
		);
		expect(offenders).toEqual([]);
	});

	test('navigates empty and newly disabled tab lists without looping or activation', async () => {
		const onValueChange = vi.fn();
		const { rerender } = render(Tabbar, {
			props: { items: ['First', 'Second'], onValueChange }
		});
		screen.getByRole('tab', { name: 'First' }).focus();
		await rerender({
			items: [
				{ label: 'First', disabled: true },
				{ label: 'Second', disabled: true }
			],
			onValueChange
		});
		await fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
		for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveAttribute('tabindex', '-1');
		await rerender({ items: [], onValueChange });
		await fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
		expect(onValueChange).not.toHaveBeenCalled();
	});
});
