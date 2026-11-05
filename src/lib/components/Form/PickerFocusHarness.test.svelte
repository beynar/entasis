<script lang="ts">
	// Test-only: a field that opens a picker, with something to press outside it.
	import Theme from '../Theme/Theme.svelte';
	import ColorInput from './ColorInput/ColorInput.svelte';
	import DateInput from './DateInput/DateInput.svelte';
	import TimeInput from './TimeInput/TimeInput.svelte';

	let { kind }: { kind: 'color' | 'date' | 'time' } = $props();
</script>

<Theme>
	<input aria-label="Other" data-testid="other" />
	<div data-testid="outside" style="height: 60px">outside</div>
	<div data-testid="field" style="width: 320px">
		{#if kind === 'color'}
			<ColorInput label="Field" />
		{:else if kind === 'date'}
			<DateInput label="Field" />
		{:else}
			<TimeInput label="Field" />
		{/if}
	</div>
</Theme>
