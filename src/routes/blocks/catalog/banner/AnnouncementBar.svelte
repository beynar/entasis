<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { xIcon } from 'entasis/icons/x';
	let visible = $state(true);
</script>

<div class="p-lg">
	{#if visible}<div
			class="gap-md bg-primary-muted p-lg flex flex-wrap items-center justify-between rounded-lg"
		>
			<div class="gap-md flex flex-wrap items-center">
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
