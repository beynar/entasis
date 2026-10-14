// The narrow handle Dialog gives its snippets and lifecycle callbacks (CX-9): `DialogApi`, never
// the internal `DialogState` class. The type assertions are checked by svelte-check.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import type { DialogApi, DialogProps } from './index.js';
import DialogApiHarness from './DialogApiHarness.test.svelte';

// Members of the state class that stay internal.
type Internals =
	| 'layer'
	| 'focusScope'
	| 'theme'
	| 'parent'
	| 'children'
	| 'dragging'
	| 'dragOffset'
	| 'stackDepth'
	| 'zIndex'
	| 'lastOpenChange'
	| 'computedTransition'
	| 'lifecycle'
	| 'contentAttachment';

describe('DialogApi types (CX-9)', () => {
	test('snippets and lifecycle callbacks receive DialogApi', () => {
		expectTypeOf<NonNullable<DialogProps['children']>>().toEqualTypeOf<Snippet<[DialogApi]>>();
		expectTypeOf<Snippet<[DialogApi]>>().toExtend<NonNullable<DialogProps['trigger']>>();
		expectTypeOf<NonNullable<DialogProps['onAfterOpen']>>().parameter(0).toEqualTypeOf<DialogApi>();
		expectTypeOf<NonNullable<DialogProps['onAfterClose']>>()
			.parameter(0)
			.toEqualTypeOf<DialogApi>();
	});

	test('the API leaves the state class internals out', () => {
		expectTypeOf<Extract<keyof DialogApi, Internals>>().toBeNever();
		expectTypeOf<keyof DialogApi>().toEqualTypeOf<
			| 'id'
			| 'isOpen'
			| 'status'
			| 'modal'
			| 'computedType'
			| 'currentSnapPoint'
			| 'triggerProps'
			| 'open'
			| 'close'
			| 'toggle'
			| 'setOpen'
			| 'setSnapPoint'
			| 'trigger'
			| 'reference'
			| 'hasTransitioned'
		>();
	});
});

describe('DialogApi at runtime (CX-9)', () => {
	test('status follows the lifecycle in both snippets and the callbacks', async () => {
		const onAfterOpen = vi.fn<(dialog: DialogApi) => void>();
		const onAfterClose = vi.fn<(dialog: DialogApi) => void>();
		render(DialogApiHarness, { props: { onAfterOpen, onAfterClose } });
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('closed');

		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		const opened = onAfterOpen.mock.calls[0][0];
		expect(opened.status).toBe('open');
		expect(opened.isOpen).toBe(true);
		expect(opened.computedType).toBe('modal');
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('open');
		expect(screen.getByTestId('panel-status')).toHaveTextContent('open');

		await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(onAfterClose.mock.calls[0][0].status).toBe('closed');
		expect(screen.getByTestId('trigger-status')).toHaveTextContent('closed');
	});
});
