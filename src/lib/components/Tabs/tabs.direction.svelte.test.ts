import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import TabsActivationHarness from './TabsActivationHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const items = ['One', 'Two', 'Three'];
const root = () => document.querySelector<HTMLElement>('[data-activation-direction]')!;
const activePanel = () => document.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!;

describe('Tabs activation direction', () => {
	test('is none before any change, on the root and on the active panel', () => {
		renderInTheme(TabsActivationHarness, { items });

		expect(root()).toHaveAttribute('data-activation-direction', 'none');
		expect(activePanel()).toHaveAttribute('data-activation-direction', 'none');
	});

	test('a click on a later tab reports right, and back reports left', async () => {
		renderInTheme(TabsActivationHarness, { items });

		await fireEvent.click(screen.getByRole('tab', { name: 'Three' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'right');
		expect(activePanel()).toHaveTextContent('Panel Three');
		expect(activePanel()).toHaveAttribute('data-activation-direction', 'right');

		await fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'left');
		expect(activePanel()).toHaveAttribute('data-activation-direction', 'left');
	});

	test('a change of the bound value from outside counts, with the new panel in the same render', async () => {
		renderInTheme(TabsActivationHarness, { items, value: 'Two' });

		await fireEvent.click(screen.getByRole('button', { name: 'Jump to first' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'left');
		expect(activePanel()).toHaveAttribute('data-activation-direction', 'left');

		await fireEvent.click(screen.getByRole('button', { name: 'Jump to last' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'right');
	});

	test('only the active panel carries the attribute', async () => {
		renderInTheme(TabsActivationHarness, { items });
		await fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
		await tick();

		const marked = document.querySelectorAll('[role="tabpanel"][data-activation-direction]');
		expect(marked).toHaveLength(1);
		expect(marked[0]).toBe(activePanel());
	});

	test('a vertical placement reports up and down', async () => {
		renderInTheme(TabsActivationHarness, { items, placement: 'left' });

		await fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'down');

		await fireEvent.click(screen.getByRole('tab', { name: 'One' }));
		await tick();
		expect(root()).toHaveAttribute('data-activation-direction', 'up');
	});
});
