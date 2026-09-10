<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Meter } from 'svelai/meter';

	let activated = $state(380);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="A little closer every day"
		description="Quarterly activation goal"
		><Stack gap="lg">
			<div class="flex items-end gap-sm">
				<strong class="text-5xl font-semibold tabular-nums">{activated}</strong><span
					class="pb-sm text-neutral/60">/ 500 teams</span
				>
			</div>
			<Meter value={{ value: activated, color: 'primary' }} max={500} label="Teams activated" />
			<div class="flex justify-between text-sm">
				<span class="text-neutral/60">{500 - activated} to go</span><strong
					>{Math.round(activated / 5)}%</strong
				>
			</div>
			<Button
				variant="outline"
				disabled={activated >= 500}
				onclick={() => (activated = Math.min(500, activated + 10))}>Add 10 demo activations</Button
			>{#if activated === 500}<Alert color="success" title="Demo goal reached" />{/if}
		</Stack></Card
	>
</Stack>
