import type { Attachment } from 'svelte/attachments';

/**
 * Arbitrary `data-*` attributes. Every component root accepts these so consumers
 * can hang test hooks, analytics markers and CSS selectors on any component.
 */
export type DataAttributes = {
	[key: `data-${string}`]: string | number | boolean | null | undefined;
};

export type WithAttachments<T> = T &
	DataAttributes & {
		[key: symbol]: Attachment<HTMLElement> | null | undefined;
	};

export type WithoutAttachments<T> = T extends WithAttachments<infer U> ? U : T;
