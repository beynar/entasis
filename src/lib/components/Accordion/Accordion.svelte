<script lang="ts" generics="Item extends Record<string, unknown>">
	import type { AccordionProps } from './accordion.props.js';
	import { useAccordionMotion, useAccordionTheme } from './accordion.theme.js';
	import AccordionPanel from './AccordionPanel.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotContent } from '../Slot/slot.js';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { plusIcon } from '../Icons/plus.js';
	import { minusIcon } from '../Icons/minus.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { createOpenChangeDetails, type OpenChangeInit } from '$lib/utils/openChange.js';
	import { openStateAttributes } from '$lib/utils/stateAttributes.js';

	let {
		items: itemsWithoutIds = $bindable([]),
		defaultValue = [],
		value = $bindable(),
		titleKey,
		contentKey,
		descriptionKey,
		disabledKey,
		disabled = false,
		oneAtATime = true,
		hiddenUntilFound = false,
		keepMounted = false,
		onItemOpenChange,
		onItemAfterOpen,
		onItemAfterClose,
		onValueChange,
		icon = 'chevron',
		variant = 'classic',
		splitted = false,
		size = 'normal',
		density = 'normal',
		class: className,
		theme,
		title,
		description,
		content,
		transition,
		headingLevel = 3,
		...attachments
	}: AccordionProps<Item> = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const id = $props.id();
	const classes = $derived(useAccordionTheme(theme));
	// One-at-a-time shows only the first requested id, whatever a parent bound.
	const expandedIds = $derived(oneAtATime ? valueState.value.slice(0, 1) : valueState.value);

	// Motion preset from `accordionTheme.motion`, through the override ladder
	// (registry → `setAccordionTheme` → instance `theme.motion` → `transition` prop).
	const resolveMotion = useAccordionMotion();
	const motion = $derived(resolveMotion(undefined, { motion: theme?.motion, transition }));

	const resolve = (item: Item, key: keyof Item) => {
		return item[key] as SlotContent<{ item: Item }> | undefined;
	};

	// Prefer the item's own id (stable across reorder/filter), but disambiguate
	// duplicates, since the expanded ids would otherwise toggle items together.
	const items = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Local duplicate counts are rebuilt for each immutable item snapshot.
		const seen = new Map<string, number>();
		return itemsWithoutIds.map((item, index) => {
			const base = 'id' in item ? String(item.id) : id + '-' + index;
			const n = seen.get(base) ?? 0;
			seen.set(base, n + 1);
			return Object.assign({}, item, { id: n ? `${base}-${n}` : base });
		}) as (Item & { id: string })[];
	});

	const isDisabled = (item: Item) =>
		disabled || item[(disabledKey ?? 'disabled') as keyof Item] === true;
	const kept = $derived(hiddenUntilFound || keepMounted);
	const triggerId = (index: number) => `${id}-trigger-${index}`;
	const panelId = (index: number) => `${id}-panel-${index}`;

	// The one path to a change: `onItemOpenChange` runs first and may cancel, then the expanded
	// ids update and `onValueChange` reports them.
	function requestChange(index: number, open: boolean, init: OpenChangeInit) {
		const target = items[index];
		if (!target || open === expandedIds.includes(target.id)) return;
		const details = createOpenChangeDetails(init);
		onItemOpenChange?.({ item: itemsWithoutIds[index], index, open, details });
		if (details.isCanceled) return;
		const next = open
			? oneAtATime
				? [target.id]
				: [...expandedIds, target.id]
			: expandedIds.filter((expandedId) => expandedId !== target.id);
		valueState.value = next;
		onValueChange?.(next);
	}
</script>

{#snippet renderIcon(isOpen: boolean)}
	{#if icon === 'chevron'}
		{@render caretDownIcon({ class: classes.icon({ size }) })}
	{:else if icon === 'plus-minus'}
		{@render (isOpen ? minusIcon : plusIcon)({ class: classes.icon({ size }) })}
	{:else if icon !== 'none'}
		<Slot class={classes.icon({ size })} render={icon} />
	{/if}
{/snippet}

<div
	data-slot="accordion"
	data-size={size}
	data-density={density}
	data-variant={variant}
	data-splitted={splitted}
	class={classes.root({ size, density, variant, splitted, className })}
	{...attachments}
>
	{#each items as accordionItem, index (accordionItem.id)}
		{@const expanded = expandedIds.includes(accordionItem.id)}
		{@const itemDisabled = isDisabled(accordionItem)}
		<div
			data-slot="accordion-item"
			data-index={index}
			data-disabled={itemDisabled ? '' : undefined}
			{...openStateAttributes(expanded)}
			class={classes.item({
				size,
				density,
				variant,
				splitted,
				expanded
			})}
		>
			<svelte:element this={`h${headingLevel}`} class={classes.heading()}>
				<button
					type="button"
					id={triggerId(index)}
					aria-expanded={expanded}
					aria-controls={expanded || kept ? panelId(index) : undefined}
					disabled={itemDisabled}
					data-slot="accordion-trigger"
					data-index={index}
					data-state={expanded ? 'open' : 'closed'}
					data-disabled={itemDisabled ? '' : undefined}
					{...openStateAttributes(expanded)}
					class={classes.trigger({ size, density, variant })}
					onclick={(event) => {
						if (itemDisabled) return;
						requestChange(index, !expanded, {
							reason: 'trigger-press',
							event,
							trigger: event.currentTarget
						});
					}}
				>
					<div class={classes.header({ size, density })}>
						<Slot
							render={title || resolve(accordionItem, titleKey || 'title')}
							class={classes.title({ size })}
							payload={{ item: accordionItem }}
						/>
						<Slot
							render={description || resolve(accordionItem, descriptionKey || 'description')}
							class={classes.description({ size })}
							payload={{ item: accordionItem }}
						/>
					</div>
					{#if icon !== 'none'}
						<span
							data-slot="accordion-icon-wrapper"
							aria-hidden="true"
							class={classes.iconWrapper({
								expanded: icon === 'chevron' && expanded
							})}
						>
							{@render renderIcon(expanded)}
						</span>
					{/if}
				</button>
			</svelte:element>

			<AccordionPanel
				id={panelId(index)}
				labelledby={triggerId(index)}
				open={expanded}
				hiddenUntilFound={hiddenUntilFound && !itemDisabled}
				keepMounted={keepMounted || (hiddenUntilFound && itemDisabled)}
				{motion}
				class={classes.content({ size, density, variant })}
				onBeforeMatch={(event) => {
					// A disabled item cannot be toggled, so find-in-page must not open it either.
					if (!itemDisabled) requestChange(index, true, { reason: 'find-in-page', event });
				}}
				onAfterOpen={() => onItemAfterOpen?.({ item: itemsWithoutIds[index], index })}
				onAfterClose={() => onItemAfterClose?.({ item: itemsWithoutIds[index], index })}
			>
				<Slot
					render={content || resolve(accordionItem, contentKey || 'content')}
					payload={{ item: accordionItem }}
				/>
			</AccordionPanel>
		</div>
	{/each}
</div>
