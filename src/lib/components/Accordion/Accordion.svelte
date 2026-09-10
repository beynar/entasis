<script lang="ts" generics="Item extends Record<string, unknown>">
	import { getters } from 'melt';
	import { Accordion } from 'melt/builders';
	import { SvelteSet } from 'svelte/reactivity';
	import type { AccordionProps } from './accordion.props.js';
	import { useAccordionTheme } from './accordion.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotContent } from '../Slot/slot.js';
	import { slide, type SlideTransitionParams } from '$lib/transitions/transition.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { plusIcon } from '../Icons/plus.js';
	import { minusIcon } from '../Icons/minus.js';
	import { untrack } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		items: itemsWithoutIds = $bindable([]),
		defaultValue = [],
		value = $bindable(),
		titleKey,
		contentKey,
		descriptionKey,
		oneAtATime = true,
		onToggle: ot,
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
		transitions,
		accessible = true,
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
	const currentValue = $derived(valueState.value);

	const themeState = useTheme();
	const split = $derived(themeState.splitTransition<SlideTransitionParams>(transitions));
	// slide is a factory: it captures the theme context at init because Svelte
	// runs transition functions outside component initialisation.
	const slideTransition = slide();

	const resolve = (item: Item, key: keyof Item) => {
		return item[key] as SlotContent<{ item: Item }> | undefined;
	};

	// Prefer the item's own id (stable across reorder/filter), but disambiguate
	// duplicates — melt keys by id, so collisions would toggle items together.
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

	let prevOpen: string[] = untrack(() => [...currentValue]);
	let isSyncingValue = false;
	const accordion = new Accordion({
		...getters({
			get multiple() {
				return !oneAtATime;
			}
		}),
		onValueChange(nextValue) {
			const next = normalizeValue(nextValue);
			const changed = [...next, ...prevOpen].find(
				(id) => next.includes(id) !== prevOpen.includes(id)
			);
			prevOpen = next;
			valueState.value = next;
			if (isSyncingValue) return;
			onValueChange?.(next);
			if (changed === undefined) return;
			const index = items.findIndex((i) => i.id === changed);
			if (index === -1) return;
			ot?.({ item: itemsWithoutIds[index], index, open: next.includes(changed) });
		}
	});

	$effect(() => {
		const requested = oneAtATime ? currentValue.slice(0, 1) : [...currentValue];
		const current = normalizeValue(accordion.value);
		if (
			current.length === requested.length &&
			current.every((id, index) => id === requested[index])
		) {
			return;
		}
		prevOpen = requested;
		isSyncingValue = true;
		try {
			accordion.value = oneAtATime ? requested[0] : new SvelteSet(requested);
		} finally {
			isSyncingValue = false;
		}
	});

	function normalizeValue(current: string | Iterable<string> | null | undefined): string[] {
		if (current == null) return [];
		return typeof current === 'string' ? [current] : [...current];
	}
</script>

{#snippet renderIcon(isOpen: boolean)}
	{#if icon && icon === 'chevron'}
		{@render caretDownIcon({ class: classes.icon({ size }) })}
	{:else if icon && icon === 'math'}
		{@render (isOpen ? minusIcon : plusIcon)({ class: classes.icon({ size }) })}
	{:else if icon}
		<Slot class={classes.icon({ size })} render={icon} />
	{/if}
{/snippet}

<div
	{...accordion.root}
	data-size={size}
	data-density={density}
	data-variant={variant}
	data-splitted={splitted}
	class={classes.root({ size, density, variant, splitted, className })}
	{...attachments}
>
	{#each items as accordionItem (accordionItem.id)}
		{@const accordionControl = accordion.getItem(accordionItem)}
		<div
			class={classes.item({
				size,
				density,
				variant,
				splitted,
				expanded: accordionControl.isExpanded
			})}
		>
			<button {...accordionControl.trigger} class={classes.trigger({ size, density, variant })}>
				<div {...accordionControl.heading} class={classes.header({ size, density })}>
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
				{#if icon}
					<span
						data-slot="accordion-icon-wrapper"
						aria-hidden="true"
						class={classes.iconWrapper({
							expanded: icon === 'chevron' && accordionControl.isExpanded
						})}
					>
						{@render renderIcon(accordionControl.isExpanded)}
					</span>
				{/if}
			</button>

			{#if accordionControl.isExpanded}
				<div
					in:slideTransition={split.in}
					out:slideTransition={split.out}
					{...accordionControl.content}
					class={classes.content({ size, density, variant })}
				>
					<Slot
						render={content || resolve(accordionItem, contentKey || 'content')}
						payload={{ item: accordionItem }}
					/>
				</div>
			{:else if accessible}
				<span class="sr-only">
					<Slot
						render={content || resolve(accordionItem, contentKey || 'content')}
						payload={{ item: accordionItem }}
					/>
				</span>
			{/if}
		</div>
	{/each}
</div>
