// The narrow handle Popover gives its snippets and lifecycle callbacks (CX-9): `PopoverApi`,
// never the internal `PopoverState` class. The type assertions are checked by svelte-check.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import type { PopoverApi, PopoverProps, PopoverState } from './index.js';
import PopoverApiHarness from './PopoverApiHarness.test.svelte';

type Row = { id: number; name: string };
// Members of the state class that stay internal.
type Internals =
	| 'layer'
	| 'focusScope'
	| 'safeArea'
	| 'hoverAction'
	| 'theme'
	| 'parent'
	| 'children'
	| 'dialogElement'
	| 'panelElement'
	| 'referenceElement'
	| 'lastOpenChange'
	| 'computedTransition'
	| 'lifecycle';

describe('PopoverApi types (CX-9)', () => {
	test('snippets and lifecycle callbacks receive PopoverApi, typed by its payload', () => {
		expectTypeOf<NonNullable<PopoverProps<Row>['children']>>().toEqualTypeOf<
			Snippet<[PopoverApi<Row>]>
		>();
		expectTypeOf<Snippet<[PopoverApi<Row>]>>().toExtend<
			NonNullable<PopoverProps<Row>['trigger']>
		>();
		expectTypeOf<NonNullable<PopoverProps<Row>['onAfterOpen']>>()
			.parameter(0)
			.toEqualTypeOf<PopoverApi<Row>>();
		expectTypeOf<NonNullable<PopoverProps<Row>['onAfterClose']>>()
			.parameter(0)
			.toEqualTypeOf<PopoverApi<Row>>();
		expectTypeOf<PopoverApi<Row>['payload']>().toEqualTypeOf<Row | undefined>();
	});

	test('the API leaves the state class internals out', () => {
		expectTypeOf<Extract<keyof PopoverApi, Internals>>().toBeNever();
		expectTypeOf<keyof PopoverApi>().toEqualTypeOf<
			| 'id'
			| 'isOpen'
			| 'status'
			| 'openReason'
			| 'activeTrigger'
			| 'placement'
			| 'triggerProps'
			| 'payload'
			| 'open'
			| 'close'
			| 'toggle'
			| 'setOpen'
			| 'trigger'
			| 'reference'
			| 'triggerFor'
			| 'hasTransitioned'
			| 'size'
			| 'position'
			| 'offset'
		>();
	});

	test('the members the 0.11.0 PopoverState documented stay readable for one minor', () => {
		expectTypeOf<PopoverApi<Row>['size']>().toEqualTypeOf<PopoverProps<Row>['size']>();
		expectTypeOf<PopoverApi<Row>['position']>().toEqualTypeOf<PopoverProps<Row>['position']>();
		expectTypeOf<PopoverApi<Row>['offset']>().toEqualTypeOf<PopoverProps<Row>['offset']>();
	});

	test('the public PopoverState is a deprecated alias of PopoverApi', () => {
		expectTypeOf<PopoverState<Row>>().toEqualTypeOf<PopoverApi<Row>>();
		expectTypeOf<
			ReturnType<typeof import('./index.js').usePopoverContext>
		>().toEqualTypeOf<PopoverApi | null>();
	});
});

describe('PopoverApi at runtime (CX-9)', () => {
	test('status follows the lifecycle in both snippets and the callbacks', async () => {
		const onAfterOpen = vi.fn<(popover: PopoverApi) => void>();
		const onAfterClose = vi.fn<(popover: PopoverApi) => void>();
		render(PopoverApiHarness, { props: { onAfterOpen, onAfterClose } });
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('closed');

		await fireEvent.click(screen.getByRole('button', { name: 'Details' }));
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		const opened = onAfterOpen.mock.calls[0][0];
		expect(opened.status).toBe('open');
		expect(opened.isOpen).toBe(true);
		expect(opened.id).toEqual(expect.any(String));
		// Deprecated 0.11.0 members still read the props.
		expect(opened.size).toBe('large');
		expect(opened.position).toBe('top');
		expect(opened.offset).toBe(12);
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('open');
		expect(screen.getByTestId('panel-status')).toHaveTextContent('open');
		expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
			'aria-controls',
			opened.id
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(onAfterClose.mock.calls[0][0].status).toBe('closed');
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('closed');
		expect(screen.getByTestId('trigger-open')).toHaveTextContent('false');
	});
});
