<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	let visible = $state(true);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#if visible}<div
			class="relative grid items-center gap-xl rounded-lg bg-primary p-xl text-primary-contrast sm:grid-cols-[1fr_auto]"
		>
			<div class="flex flex-col gap-lg">
				<Chip variant="soft" color="neutral" class="w-fit">The archive edit</Chip><Heading size="h3"
					>Good things, a little less.</Heading
				>
				<p class="opacity-80">Save up to 30% on a considered selection from past collections.</p>
			</div>
			<div class="flex flex-col gap-lg items-start">
				<Button href="/components" color="neutral">Explore the edit ↗</Button><Button
					variant="ghost"
					color="neutral"
					size="small"
					onclick={() => (visible = false)}>Dismiss promotion</Button
				>
			</div>
		</div>{:else}<Button variant="outline" class="self-start" onclick={() => (visible = true)}
			>Show seasonal promotion</Button
		>{/if}
</section>
