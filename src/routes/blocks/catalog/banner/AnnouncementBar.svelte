<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { xIcon } from 'svelai/icons/x';
	let visible = $state(true);
</script>

<div class="p-lg">
	{#if visible}<div
			class="flex flex-wrap items-center justify-between gap-md rounded-lg bg-primary-muted p-lg"
		>
			<div class="flex flex-wrap items-center gap-md">
				<Chip color="primary" variant="solid" size="small">New release</Chip>
				<p>Meet the next generation of our component library.</p>
				<Button href="/components" variant="link" suffix={arrowRightIcon}>See what is new</Button>
			</div>
			<Button
				variant="ghost"
				size="small"
				label="Dismiss announcement"
				prefix={xIcon}
				onclick={() => (visible = false)}
			/>
		</div>{:else}<Button variant="outline" onclick={() => (visible = true)}
			>Show announcement</Button
		>{/if}
</div>
