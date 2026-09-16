<script lang="ts">
	import { slide } from 'svelte/transition';
	import Slot from '../Slot/Slot.svelte';
	import Chip from '../Chip/Chip.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type {
		MetadataListItem,
		MetadataListItemPayload,
		MetadataListItemType,
		MetadataListProps
	} from './metadataList.props.js';
	import { useMetadataListTheme } from './metadataList.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		items = [],
		size = 'normal',
		density = 'normal',
		columns = 1,
		maxItems,
		expanded = $bindable(),
		defaultExpanded = false,
		i18n,
		theme,
		title,
		description,
		key,
		value,
		...attachments
	}: MetadataListProps = $props();

	const expandedState = createBindableValue(
		() => expanded,
		(next) => {
			expanded = next;
		},
		() => defaultExpanded
	);

	const t = $derived(useI18n(i18n));
	const classes = $derived(useMetadataListTheme(theme));

	// Formatters derived once from the active locale rather than rebuilt per item in the loop.
	const numberFormat = $derived(new Intl.NumberFormat(t.locale));
	const dateFormat = $derived(new Intl.DateTimeFormat(t.locale, { dateStyle: 'medium' }));

	// Chip sizing: large lists get normal chips, everything else small.
	const chipSize = $derived(size === 'large' ? 'normal' : 'small');

	const columnsStyle = $derived(`grid-template-columns: repeat(${columns}, minmax(0, 1fr))`);

	// `||` (not `??`) so maxItems=0 means "no limit" instead of hiding every item with no toggle.
	const limit = $derived(maxItems || items.length);
	const visibleItems = $derived(items.slice(0, limit));
	const hiddenItems = $derived(items.slice(limit));
	const hasMore = $derived(!!maxItems && items.length > maxItems);

	const resolveLabel = (item: MetadataListItem) => item.key ?? item.title ?? item.id ?? '';

	const detectType = (item: MetadataListItem): MetadataListItemType => {
		if (item.type) return item.type;
		const v = item.value;
		if (v === null || v === undefined) return 'text';
		if (typeof v === 'boolean') return 'boolean';
		if (typeof v === 'number') return 'number';
		if (v instanceof Date) return 'date';
		if (Array.isArray(v)) return 'chips';
		if (typeof v === 'string') {
			if (/^https?:\/\//i.test(v)) return 'url';
			if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
		}
		return 'text';
	};

	const formatValue = (item: MetadataListItem, type: MetadataListItemType): string => {
		const v = item.value;
		if (v === null || v === undefined) return '—';
		switch (type) {
			case 'number':
				return typeof v === 'number' ? numberFormat.format(v) : String(v);
			case 'date': {
				const date = v instanceof Date ? v : new Date(v as string | number);
				return isNaN(date.getTime()) ? String(v) : dateFormat.format(date);
			}
			case 'boolean':
				return v ? t.trueLabel : t.falseLabel;
			case 'chips':
				return Array.isArray(v) ? v.join(', ') : String(v);
			case 'url':
				// Display text drops the protocol and any trailing slash (github.com/org/repo).
				return String(v)
					.replace(/^https?:\/\//i, '')
					.replace(/\/$/, '');
			default:
				return String(v);
		}
	};

	const resolveHref = (item: MetadataListItem, type: MetadataListItemType): string => {
		if (item.href) return item.href;
		const v = String(item.value ?? '');
		if (type === 'email') return `mailto:${v}`;
		if (type === 'phone') return `tel:${v}`;
		return v;
	};

	const toPayload = (
		item: MetadataListItem,
		index: number,
		type: MetadataListItemType,
		label: string,
		formatted: string
	): MetadataListItemPayload => ({ item, index, type, label, formatted });
</script>

{#snippet valueContent(item: MetadataListItem, type: MetadataListItemType, formatted: string)}
	{#if item.value === null || item.value === undefined}
		<span class="text-neutral/70">—</span>
	{:else if type === 'url' || type === 'email' || type === 'phone'}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs (and mailto:/tel: links); library links cannot depend on SvelteKit routing. -->
		<a
			href={resolveHref(item, type)}
			class={classes.link()}
			target={type === 'url' ? '_blank' : undefined}
			rel={type === 'url' ? 'noopener noreferrer' : undefined}>{formatted}</a
		>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else if type === 'boolean'}
		<Chip variant="soft" size={chipSize} color={item.color ?? (item.value ? 'success' : 'neutral')}>
			{item.value ? t.trueLabel : t.falseLabel}
		</Chip>
	{:else if type === 'chip'}
		<Chip variant="soft" size={chipSize} color={item.color ?? 'neutral'}>{String(item.value)}</Chip>
	{:else if type === 'chips'}
		<div class={classes.chips({ density })}>
			{#each Array.isArray(item.value) ? item.value : [item.value] as entry, i (i)}
				<Chip variant="soft" size={chipSize} color={item.color ?? 'neutral'}>{String(entry)}</Chip>
			{/each}
		</div>
	{:else}
		<span class={type === 'number' ? 'tabular-nums' : undefined}>{formatted}</span>
	{/if}
{/snippet}

{#snippet row(item: MetadataListItem, index: number)}
	{@const type = detectType(item)}
	{@const label = resolveLabel(item)}
	{@const formatted = formatValue(item, type)}
	{@const payload = toPayload(item, index, type, label, formatted)}
	<div class={classes.item({ density })}>
		<dt class={classes.key({ size, density })}>
			<Slot render={item.icon} class={classes.keyIcon({ size })} />
			<Slot render={key} {payload}>{label}</Slot>
		</dt>
		<dd class={classes.value({ size })}>
			<Slot render={value} {payload}>
				{@render valueContent(item, type, formatted)}
			</Slot>
		</dd>
	</div>
{/snippet}

<div
	bind:this={ref}
	data-density={density}
	class={classes.root({ density, className })}
	{...attachments}
>
	{#if title || description}
		<div class={classes.header({ density })}>
			<Slot render={title} class={classes.title({ size })} />
			<Slot render={description} class={classes.description({ size })} />
		</div>
	{/if}

	<dl class={classes.list({ density })} style={columnsStyle}>
		<!-- Block A rows are direct grid children of the dl so they flow into the columns. -->
		<!-- Keyed by index: items may legitimately repeat a key label, which would crash an identity key. -->
		{#each visibleItems as item, index (index)}
			{@render row(item, index)}
		{/each}

		{#if hiddenItems.length && expandedState.value}
			<!-- Block B: a full-span nested grid mirrors the dl columns; slide needs a block box (not display:contents). -->
			<div
				class={classes.list({ density })}
				style={`grid-column: 1 / -1; ${columnsStyle}`}
				transition:slide={{ duration: 200 }}
			>
				{#each hiddenItems as item, index (index)}
					{@render row(item, limit + index)}
				{/each}
			</div>
		{/if}
	</dl>

	{#if hasMore}
		<button
			type="button"
			aria-expanded={expandedState.value}
			class={classes.toggle({ size, density })}
			onclick={() => (expandedState.value = !expandedState.value)}
		>
			<!-- The rotation class lives on a span (plain reactive attribute), not on the icon snippet's props. -->
			<span class={classes.toggleIcon({ expanded: expandedState.value })} aria-hidden="true">
				{@render caretDownIcon({})}
			</span>
			{expandedState.value ? t.showLess : t.showMoreItems(items.length - (maxItems ?? 0))}
		</button>
	{/if}
</div>
