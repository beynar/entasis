<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { formatAddress } from './address.js';
	import type { AddressProps } from './address.props.js';
	import { useAddressTheme } from './address.theme.js';

	let {
		address,
		fields,
		layout = 'block',
		size = 'normal',
		empty,
		ref = $bindable(null),
		class: className,
		theme,
		...rest
	}: AddressProps = $props();

	const t = $derived(useI18n());
	const classes = $derived(useAddressTheme(theme));
	// The country is named in the active locale when the value only carries its code.
	const lines = $derived(formatAddress(address, { fields, locale: t.locale }));
</script>

<address
	bind:this={ref}
	data-slot="address"
	data-layout={layout}
	data-empty={lines.length === 0 ? 'true' : undefined}
	class={classes.root({ size, layout, className })}
	{...rest}
>
	{#each lines as line, index (index)}
		<span data-slot="address-line" class={classes.line({ layout })}
			>{line}{#if layout === 'inline' && index < lines.length - 1},
			{/if}</span
		>
	{:else}
		{#if empty}
			<Slot as="span" render={empty} class={classes.empty()} />
		{/if}
	{/each}
</address>
