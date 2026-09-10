<script lang="ts">
	import { clockIcon } from '../../Icons/clock.js';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import type { Sizes } from '$lib/types/theme.js';

	type TimeInputTriggerProps = {
		open: boolean;
		disabled?: boolean;
		controls: string;
		size?: Sizes;
		onToggle: () => void;
	};

	let { open, disabled, controls, size, onToggle }: TimeInputTriggerProps = $props();
</script>

<FieldActionButton
	active={open}
	{size}
	label="Choose time"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls={open ? controls : undefined}
	{disabled}
	prefix={clockIcon}
	onclick={onToggle}
/>
