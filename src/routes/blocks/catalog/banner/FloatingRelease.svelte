<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { xIcon } from 'svelai/icons/x';
	let visible = $state(true);
</script>

<div class="flex min-h-72 items-end justify-end bg-surface-recessed p-xl">
	<Card
		class="w-full max-w-sm"
		title="A fresh perspective"
		description="Version 2.0 is here"
		action={{
			variant: 'ghost',
			size: 'small',
			prefix: xIcon,
			label: 'Dismiss release note',
			onclick: () => (visible = false)
		}}
		><Stack gap="lg"
			>{#if visible}<p class="text-neutral/70">
					More expressive themes, calmer defaults, and a component for every moment.
				</p>
				<Button href="/components" variant="outline" fullWidth suffix={arrowRightIcon}
					>Explore the library</Button
				>{:else}<p class="text-sm text-neutral/60">Release note dismissed.</p>
				<Button variant="link" onclick={() => (visible = true)}>Show again</Button>{/if}</Stack
		></Card
	>
</div>
