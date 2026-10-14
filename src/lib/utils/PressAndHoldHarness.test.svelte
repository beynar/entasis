<script lang="ts">
	// Harness for `usePressAndHold.svelte.test.ts`: a stepper button counting up to `max`.
	import { usePressAndHold } from './usePressAndHold.svelte.js';

	let {
		max = Infinity,
		disabled = false,
		onStop
	}: { max?: number; disabled?: boolean; onStop?: () => void } = $props();

	let value = $state(0);
	const increment = () => {
		if (value >= max) return false;
		value += 1;
		return value < max;
	};

	const hold = usePressAndHold({
		onStep: increment,
		disabled: () => disabled,
		onStop: () => onStop?.()
	});
</script>

<button
	type="button"
	{@attach hold.attachment}
	onclick={(event) => {
		if (!hold.shouldSkipClick(event)) increment();
	}}>Increment</button
>
<output data-testid="value">{value}</output>
<button type="button" onclick={() => hold.stop()}>Stop</button>
