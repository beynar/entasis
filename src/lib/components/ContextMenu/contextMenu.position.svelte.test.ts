// `popup.position` is documented as configurable, but ContextMenu set its own
// `position="bottom-start"` after spreading `popup`, so the consumer's placement never reached the
// Popover. jsdom has no viewport for floating-ui to flip against, so the test reads the placement
// the Popover asks floating-ui for.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import ContextMenu from './ContextMenu.svelte';
import type { ContextMenuProps } from './contextMenu.props.js';

type PositionOptions = { placement?: string } | undefined;
const { computePosition } = vi.hoisted(() => ({
	computePosition: vi.fn(async (_reference?: unknown, _floating?: unknown, options?: unknown) => ({
		x: 0,
		y: 0,
		strategy: 'fixed' as const,
		placement: (options as PositionOptions)?.placement ?? 'bottom',
		middlewareData: {}
	}))
}));
vi.mock('@floating-ui/dom', async (importOriginal) => ({
	...(await importOriginal<typeof import('@floating-ui/dom')>()),
	computePosition
}));

const target = createRawSnippet(() => ({ render: () => '<button>Target</button>' }));

const openAtPointer = async (popup?: ContextMenuProps['popup']) => {
	renderInTheme(ContextMenu, {
		items: [{ type: 'option', title: 'Copy' }],
		children: target,
		popup
	});
	await fireEvent.contextMenu(screen.getByRole('button', { name: 'Target' }), {
		clientX: 300,
		clientY: 200
	});
	await screen.findByRole('menu');
	await waitFor(() => expect(computePosition).toHaveBeenCalled());
	const placed = computePosition.mock.calls.filter(([, , options]) => options);
	return (placed.at(-1)?.[2] as PositionOptions)?.placement;
};

describe('context menu position', () => {
	beforeEach(() => computePosition.mockClear());

	test('opens below and after the pointer by default', async () => {
		expect(await openAtPointer()).toBe('bottom-start');
	});

	test('popup.position places the menu relative to the pointer', async () => {
		expect(await openAtPointer({ position: 'right-start' })).toBe('right-start');
	});

	test('a responsive popup.position resolves like any Popover position', async () => {
		expect(await openAtPointer({ position: { xs: 'top-end' } })).toBe('top-end');
	});
});
