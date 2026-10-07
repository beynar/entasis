<script lang="ts">
	import { resolve } from '$app/paths';
	import { compassIcon } from 'entasis/icons/compass';
	import { brand } from './content.js';

	interface Props {
		/** On a brand-coloured surface the mark inverts instead of disappearing into it. */
		onBrand?: boolean;
		size?: 'normal' | 'large';
		class?: string;
	}

	let { onBrand = false, size = 'normal', class: className = '' }: Props = $props();
</script>

<a
	href={resolve('/blocks/generative')}
	class="gap-sm inline-flex items-center font-semibold tracking-tight {size === 'large'
		? 'text-xl'
		: 'text-base'} {className}"
>
	<span
		class="grid place-items-center rounded-md {size === 'large' ? 'size-8' : 'size-6'} {onBrand
			? 'bg-primary-contrast text-primary'
			: 'bg-primary text-primary-contrast'}"
		aria-hidden="true">{@render compassIcon()}</span
	>
	{brand.name}
</a>
