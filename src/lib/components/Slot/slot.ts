import { type Snippet } from 'svelte';

export type SnippetSlot<Payload = undefined> = Payload extends undefined
	? Snippet
	: Snippet<[Payload]>;
export type Slot<Payload = undefined> = string | SnippetSlot<Payload>;

export type WithSlot<Props, Name extends string, Payload = undefined> = Props & {
	[P in Name]?: Slot<Payload>;
};

export function isSnippet(component: unknown) {
	return typeof component === 'function' && component.length === 1;
}
