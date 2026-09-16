<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	let visible = $state(true);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#if visible}<div
			class="gap-xl bg-primary p-xl text-primary-contrast relative grid items-center rounded-lg sm:grid-cols-[1fr_auto]"
		>
			<div class="gap-lg flex flex-col">
				<Chip variant="soft" color="neutral" class="w-fit">The archive edit</Chip><Heading size="h3"
					>Good things, a little less.</Heading
				>
				<p>Save up to 30% on a considered selection from past collections.</p>
			</div>
			<div class="gap-lg flex flex-col items-start">
				<Button href="/components" color="neutral">Explore the edit ↗</Button><Button
					variant="soft"
					color="neutral"
					size="small"
					onclick={() => (visible = false)}>Dismiss promotion</Button
				>
			</div>
		</div>{:else}<Button variant="outline" class="self-start" onclick={() => (visible = true)}
			>Show seasonal promotion</Button
		>{/if}
</section>
