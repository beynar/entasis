<script lang="ts">
	// The list Combobox and TagsInput open under their input: a listbox of options and groups,
	// with the loading, error and "no options" message beside it (a listbox may only own options
	// and groups). Live announcements come from the controller's persistent region, not from here.
	import type { Snippet } from 'svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import MenuOption from '../../MenuOption/MenuOption.svelte';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import { toRenderGroups } from './combobox.items.js';
	import type { ComboboxController } from './combobox.state.svelte.js';
	import type { ComboboxOption } from './combobox.props.js';

	type PartClass = (props: { size: Sizes }) => string;

	let {
		controller,
		classes,
		size,
		density,
		separators = true,
		item,
		isSelected,
		i18n
	}: {
		controller: ComboboxController;
		classes: {
			loading: PartClass;
			error: PartClass;
			noOptions: PartClass;
			group: PartClass;
			groupLabel: PartClass;
			separator: PartClass;
		};
		size: Sizes;
		density: Density;
		separators?: boolean;
		item?: Snippet<[ComboboxOption]>;
		isSelected?: (option: ComboboxOption) => boolean;
		i18n?: Parameters<typeof useI18n>[0];
	} = $props();

	const t = $derived(useI18n(i18n));
	const view = $derived(controller.view);
	const status = $derived(controller.status);
	const groups = $derived(toRenderGroups(view.items));
	// The controller is created once per field; its navigation object is stable.
	// svelte-ignore state_referenced_locally
	const nav = controller.nav;
	const listClass =
		'flex max-h-[min(200px,calc(var(--available-height,100dvh)_-_2*var(--space-xs)))] flex-col gap-1';
</script>

{#snippet row(option: ComboboxOption)}
	{#snippet customRow()}
		{@render item?.(option)}
	{/snippet}
	<MenuOption
		as="button"
		role="option"
		{size}
		{density}
		title={item ? undefined : option.label}
		description={item ? undefined : option.description}
		children={item ? customRow : undefined}
		highlighted={nav.highlighted === option.value}
		selected={isSelected?.(option) ?? false}
		disabled={!!option.disabled}
		onclick={(event) => controller.selectOption(option, event)}
		attrs={{
			id: nav.optionId(option.value),
			tabindex: -1,
			onpointermove: (event: PointerEvent) => {
				if (!option.disabled) nav.pointerHighlight(option.value, event);
			}
		}}
	/>
{/snippet}

<!-- A press anywhere in the list (padding, group labels, the scrollbar) must not move focus off
     the input, or the field would lose it and the list would close before the click lands. -->
<div role="presentation" class="flex flex-col" onmousedown={controller.preventBlur}>
	{#if status}
		<div class={classes[status.kind === 'empty' ? 'noOptions' : status.kind]({ size })}>
			{status.text}
		</div>
	{/if}
	{#if view.hasOptions}
		<!-- The scrolling viewport is the listbox, so options and groups are its only children. It is
		     focusable from script only (tabindex -1): DOM focus stays on the input, and the input's
		     active descendant scrolls the highlighted option into view. -->
		<ScrollArea
			bind:viewportRef={controller.viewport}
			viewportAttrs={{
				id: controller.listboxId,
				role: 'listbox',
				'aria-label': t.options,
				'aria-busy': view.loading || undefined,
				tabindex: -1
			}}
			scrollOnEdges
			type="auto"
			class={listClass}
		>
			{#each groups as group, groupIndex (groupIndex)}
				{#if separators && groupIndex > 0}
					<!-- Decorative divider between groups: the groups already convey the structure. -->
					<div role="presentation" class={classes.separator({ size })}></div>
				{/if}
				{#if group.label}
					<div role="group" aria-label={group.label} class={classes.group({ size })}>
						<div aria-hidden="true" class={classes.groupLabel({ size })}>{group.label}</div>
						{#each group.items as option (option.value)}
							{@render row(option)}
						{/each}
					</div>
				{:else}
					{#each group.items as option (option.value)}
						{@render row(option)}
					{/each}
				{/if}
			{/each}
		</ScrollArea>
	{:else}
		<!-- Kept mounted while empty (hidden) so the input's aria-controls always resolves. -->
		<div id={controller.listboxId} role="listbox" aria-label={t.options} hidden></div>
	{/if}
</div>
