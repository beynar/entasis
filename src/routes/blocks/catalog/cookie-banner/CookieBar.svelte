<script lang="ts">
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	let choice = $state<string | null>(null);
</script>

<section class="gap-lg bg-surface-recessed p-lg flex min-h-64 flex-col justify-end">
	<p class="text-neutral/65 text-center text-sm">An example page</p>
	{#if choice === null}<div
			class="gap-lg border-neutral-muted bg-surface p-lg flex flex-wrap items-center justify-between rounded-lg border"
		>
			<div class="max-w-xl">
				<Heading as="h2" size="h5">A little context about cookies</Heading>
				<p class="mt-sm text-neutral/70 text-sm">
					Essential cookies keep the site working. Optional analytics help us understand what is
					useful.
				</p>
			</div>
			<div class="gap-sm flex flex-wrap">
				<Button variant="outline" onclick={() => (choice = 'Essential only')}>Essential only</Button
				><Button onclick={() => (choice = 'All cookies')}>Accept all</Button>
			</div>
		</div>{:else}<div
			class="gap-md bg-surface p-lg flex flex-wrap items-center justify-between rounded-lg"
			role="status"
		>
			<p class="text-sm">Preview preference: <strong>{choice}</strong></p>
			<Button variant="link" onclick={() => (choice = null)}>Change preference</Button>
		</div>{/if}
</section>
