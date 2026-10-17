import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type {
	AIThreadItem,
	AIThreadTocEntry,
	AIThreadTocPinPayload,
	AIThreadTocPreviewAlign,
	AIThreadTocPreviewSide,
	AIThreadTocSide,
	AIThreadTocState
} from '../AIThread/aiThread.props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIThreadTocThemeProps } from './aiThreadToc.theme.js';

export type {
	AIFileSource,
	AIThreadItem,
	AIThreadTocEntry,
	AIThreadTocPin,
	AIThreadTocPinPayload,
	AIThreadTocPreviewAlign,
	AIThreadTocPreviewSide,
	AIThreadTocRange,
	AIThreadTocSide,
	AIThreadTocState
} from '../AIThread/aiThread.props.js';

type AIThreadTocRootAttributes = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'>;

export type AIThreadTocProps<TMessage extends AIThreadItem = AIThreadItem> = WithAttachments<
	AIThreadTocRootAttributes & {
		/** Bindable reference to the table-of-contents root. */
		ref?: HTMLElement | null;
		/** Navigable user-turn state, usually derived from AIThread measurements. */
		state: AIThreadTocState<TMessage>;
		/** Maximum visible navigation pins before entries are compacted. */
		maxPins?: number;
		/**
		 * Draws a rail beside the pins with a bar marking the part of the thread on screen.
		 * @default false
		 */
		showRange?: boolean;
		/** Accessible label for the nested scrollable pin region. */
		scrollAreaLabel?: string;
		/** Side occupied by the navigation rail. @default 'left' */
		side?: AIThreadTocSide;
		/** Preferred side for user-turn previews. Defaults away from the rail. */
		previewSide?: AIThreadTocPreviewSide;
		/** Alignment of previews relative to their navigation pins. */
		previewAlign?: AIThreadTocPreviewAlign;
		/**
		 * Container width in pixels below which the rail removes itself. The container is the
		 * nearest ancestor wider than the rail, usually the thread. `0` keeps it at every width.
		 * @default 480
		 */
		minContainerWidth?: number;
		/** Replaces the visual indicator for each navigation pin. */
		pin?: Slot<AIThreadTocPinPayload<TMessage>>;
		/** Replaces the complete preview for a user turn. */
		preview?: Slot<AIThreadTocEntry<TMessage>>;
		/** Replaces the user-prompt title in the preview. */
		title?: Slot<AIThreadTocEntry<TMessage>>;
		/** Replaces the latest-assistant-response excerpt in the preview. */
		excerpt?: Slot<AIThreadTocEntry<TMessage>>;
		/** Replaces the preview file metadata. */
		metadata?: Slot<AIThreadTocEntry<TMessage>>;
		/** Optional icon shown in the preview header. */
		icon?: Slot<AIThreadTocEntry<TMessage>>;
		/** Class applied to the table-of-contents root. */
		class?: string;
		/** Theme overrides for the rail, pins, scroll area, and preview. */
		theme?: AIThreadTocThemeProps;
	}
>;
