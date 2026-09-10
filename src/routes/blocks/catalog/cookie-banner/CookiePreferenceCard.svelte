<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Switch } from 'svelai/switch';
	let expanded = $state(false);
	let analytics = $state(false);
	let personalization = $state(false);
	let saved = $state(false);
</script>

<section class="flex min-h-96 items-end justify-start bg-surface-recessed p-lg">
	<Card class="w-full max-w-md" title="Your privacy, your choice" variant="outline"
		><Stack gap="lg"
			><p class="text-sm text-neutral/70">
				Choose which optional cookies this example may use. Essential cookies remain on.
			</p>
			{#if saved}<div class="rounded-lg bg-success-muted p-md" role="status">
					<p class="text-sm">
						Preview preference saved: {analytics ? 'Analytics on' : 'Analytics off'}, {personalization
							? 'personalization on'
							: 'personalization off'}.
					</p>
				</div>
				<Button variant="link" onclick={() => (saved = false)}>Change preferences</Button
				>{:else}{#if expanded}<div class="flex flex-col gap-lg">
						<Switch label="Essential cookies" value={true} disabled /><Switch
							label="Analytics"
							bind:value={analytics}
						/><Switch label="Personalization" bind:value={personalization} />
					</div>{/if}
				<div class="flex flex-wrap gap-sm">
					<Button variant="outline" onclick={() => (expanded = !expanded)}
						>{expanded ? 'Hide details' : 'Customize'}</Button
					><Button
						onclick={() => {
							if (!expanded) {
								analytics = true;
								personalization = true;
							}
							saved = true;
						}}>{expanded ? 'Save preferences' : 'Accept all'}</Button
					>
				</div>
				<Button
					variant="link"
					class="self-start"
					onclick={() => {
						analytics = false;
						personalization = false;
						saved = true;
					}}>Essential only</Button
				>{/if}</Stack
		></Card
	>
</section>
