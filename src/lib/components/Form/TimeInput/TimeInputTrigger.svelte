<script lang="ts">
	import { clockIcon } from '../../Icons/clock.js';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type TimeInputTriggerProps = {
		open: boolean;
		disabled?: boolean;
		controls: string;
		size?: Sizes;
		onToggle: () => void;
	};

	let { open, disabled, controls, size, onToggle }: TimeInputTriggerProps = $props();
	const t = $derived(useI18n());
</script>

<FieldActionButton
	active={open}
	{size}
	label={`${t.choose} ${t.time}`}
	haspopup="dialog"
	expanded={open}
	controls={open ? controls : undefined}
	{disabled}
	prefix={clockIcon}
	onclick={onToggle}
/>
