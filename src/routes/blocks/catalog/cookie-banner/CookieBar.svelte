<script lang="ts">
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	let choice = $state<string | null>(null);
</script>

<section class="flex min-h-64 flex-col justify-end gap-lg bg-surface-recessed p-lg">
	<p class="text-center text-sm text-neutral/50">An example page</p>
	{#if choice === null}<div
			class="flex flex-wrap items-center justify-between gap-lg rounded-lg border border-neutral-muted bg-surface p-lg"
		>
			<div class="max-w-xl">
				<Heading as="h2" size="h5">A little context about cookies</Heading>
				<p class="mt-sm text-sm text-neutral/70">
					Essential cookies keep the site working. Optional analytics help us understand what is
					useful.
				</p>
			</div>
			<div class="flex flex-wrap gap-sm">
				<Button variant="outline" onclick={() => (choice = 'Essential only')}>Essential only</Button
				><Button onclick={() => (choice = 'All cookies')}>Accept all</Button>
			</div>
		</div>{:else}<div
			class="flex flex-wrap items-center justify-between gap-md rounded-lg bg-surface p-lg"
			role="status"
		>
			<p class="text-sm">Preview preference: <strong>{choice}</strong></p>
			<Button variant="link" onclick={() => (choice = null)}>Change preference</Button>
		</div>{/if}
</section>
