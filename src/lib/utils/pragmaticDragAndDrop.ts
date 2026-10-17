import type * as AutoScrollElement from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import type * as Combine from '@atlaskit/pragmatic-drag-and-drop/combine';
import type * as ElementAdapter from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type * as DisableNativeDragPreview from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview';
import type * as PointerOutsideOfPreview from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import type * as SetCustomNativeDragPreview from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import type * as PreventUnhandled from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled';
import type * as Reorder from '@atlaskit/pragmatic-drag-and-drop/reorder';

// The installed Atlaskit packages publish typed directory entry points that Node ESM cannot
// load after SSR externalization. Their explicit CommonJS files are runtime-safe but omit
// adjacent declarations, so this boundary reconnects each verified runtime to its public type.
// The auto-scroll element entry point binds itself to `@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter`,
// which bundlers resolve to the package's ESM copy while the CommonJS adapter below is a second
// copy. Its monitor would then never see a drag, so the scroller is built here on our own adapter.
// @ts-expect-error See compatibility boundary above.
import * as autoScrollApiRuntime from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/dist/cjs/over-element/make-api.js';
// @ts-expect-error See compatibility boundary above.
import * as combineRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/combine.js';
// @ts-expect-error See compatibility boundary above.
import * as elementAdapterRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/adapter.js';
// @ts-expect-error See compatibility boundary above.
import * as disableNativeDragPreviewRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/disable-native-drag-preview.js';
// @ts-expect-error See compatibility boundary above.
import * as pointerOutsideOfPreviewRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/pointer-outside-of-preview.js';
// @ts-expect-error See compatibility boundary above.
import * as setCustomNativeDragPreviewRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/set-custom-native-drag-preview.js';
// @ts-expect-error See compatibility boundary above.
import * as preventUnhandledRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/prevent-unhandled.js';
// @ts-expect-error See compatibility boundary above.
import * as reorderRuntime from '@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/reorder.js';

const combineEntry = combineRuntime as typeof Combine;
const elementAdapter = elementAdapterRuntime as typeof ElementAdapter;
const disableNativeDragPreviewEntry =
	disableNativeDragPreviewRuntime as typeof DisableNativeDragPreview;
const pointerOutsideOfPreviewEntry =
	pointerOutsideOfPreviewRuntime as typeof PointerOutsideOfPreview;
const setCustomNativeDragPreviewEntry =
	setCustomNativeDragPreviewRuntime as typeof SetCustomNativeDragPreview;
const preventUnhandledEntry = preventUnhandledRuntime as typeof PreventUnhandled;
const reorderEntry = reorderRuntime as typeof Reorder;
const { preventUnhandled } = preventUnhandledEntry;
const { makeApi } = autoScrollApiRuntime as {
	makeApi: (args: { monitor: typeof elementAdapter.monitorForElements }) => {
		autoScroll: typeof AutoScrollElement.autoScrollForElements;
		autoScrollWindow: typeof AutoScrollElement.autoScrollWindowForElements;
	};
};
const autoScroll = makeApi({ monitor: elementAdapter.monitorForElements });

export const autoScrollForElements = autoScroll.autoScroll;
export const autoScrollWindowForElements = autoScroll.autoScrollWindow;
export const { combine } = combineEntry;
export const draggable: typeof elementAdapter.draggable = (args) =>
	elementAdapter.draggable({
		...args,
		onDragStart(payload) {
			// Keep every library-owned drag on the managed drop path instead of native snap-back.
			preventUnhandled.start();
			args.onDragStart?.(payload);
		},
		onDrop(payload) {
			preventUnhandled.stop();
			args.onDrop?.(payload);
		}
	});
export const { dropTargetForElements, monitorForElements } = elementAdapter;
export const { disableNativeDragPreview } = disableNativeDragPreviewEntry;
export const { pointerOutsideOfPreview } = pointerOutsideOfPreviewEntry;
export const { setCustomNativeDragPreview } = setCustomNativeDragPreviewEntry;
export const { reorder } = reorderEntry;

export type { ElementEventPayloadMap } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
