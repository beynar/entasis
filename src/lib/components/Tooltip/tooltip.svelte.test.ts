import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
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
