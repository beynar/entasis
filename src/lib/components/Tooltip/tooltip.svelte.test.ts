import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TooltipComponentHarness from './TooltipComponentHarness.test.svelte';
import TooltipLawHarness from './TooltipLawHarness.test.svelte';

describe('Tooltip lifecycle', () => {
	test('retains the close callback until the tooltip has finished closing', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(TooltipLawHarness, { props: { onAfterOpen, onAfterClose } });
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });
		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content');
		expect(onAfterClose).not.toHaveBeenCalled();

		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});
});

describe('Tooltip component', () => {
	test('opens on hover of a snippet trigger and renders its content', async () => {
		render(TooltipComponentHarness);
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content'));

		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('renders the tooltip immediately when open is true', async () => {
		render(TooltipComponentHarness, { props: { open: true } });
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content'));
	});

	test('reports hover-driven visibility through onOpenChange', async () => {
		const onOpenChange = vi.fn();
		render(TooltipComponentHarness, { props: { onOpenChange } });
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });

		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));

		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
	});
});
