<script lang="ts" module>
	import type { EventCalendarApi } from './index.js';
	import type { EventCalendarProps } from './eventCalendar.props.js';

	/**
	 * Props for {@link EventCalendarTestHarness}. Mirrors the public `EventCalendarProps`
	 * surface, but makes the otherwise required `date` and `timeZone` optional so tests can
	 * spread a single object onto the harness. `api` collects the component's exported
	 * imperative API once mounted, and `items`, `view`, `date`, `dayCount`, `selection`,
	 * `ref`, and `api` all write back through `$bindable` so callers can assert on
	 * calendar-originated mutations on their own props object.
	 */
	export type EventCalendarTestHarnessProps<
		TItemFields extends object = Record<never, never>,
		TResourceFields extends object = Record<never, never>
	> = Omit<EventCalendarProps<TItemFields, TResourceFields>, 'date' | 'timeZone'> & {
		/** Bindable anchor instant. Defaults to `2026-07-15T10:00:00.000Z`. */
		date?: Date;
		/** Required IANA display time zone or `UTC`. Defaults to `UTC`. */
		timeZone?: string;
		/** Receives the EventCalendar exported API object once mounted. */
		api?: EventCalendarApi<TItemFields> | null;
	};
</script>

<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Theme from '../Theme/Theme.svelte';
	import { EventCalendar } from './index.js';

	let {
		items = $bindable([]),
		view = $bindable('month'),
		date = $bindable(new Date('2026-07-15T10:00:00.000Z')),
		dayCount = $bindable(3),
		selection = $bindable(),
		ref = $bindable(null),
		api = $bindable(null),
		timeZone = 'UTC',
		locale = 'en',
		...rest
	}: EventCalendarTestHarnessProps<TItemFields, TResourceFields> = $props();

	// Mount-level props are write-only here — $bindable write-back never reaches the object
	// passed to render() — so tests read live values through these component exports.
	export const getApi = () => api;
	export const getItems = () => items;
	export const getView = () => view;
	export const getDate = () => date;
	export const getDayCount = () => dayCount;
	export const getSelection = () => selection;
	export const getRef = () => ref;
</script>

<Theme>
	<EventCalendar
		bind:items
		bind:view
		bind:date
		bind:dayCount
		bind:selection
		bind:this={api}
		bind:ref
		{timeZone}
		{locale}
		{...rest}
	/>
</Theme>
