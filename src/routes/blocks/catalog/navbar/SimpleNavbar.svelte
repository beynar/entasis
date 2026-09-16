<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { listIcon } from 'svelai/icons/list';
	let open = $state(false);
</script>

<section class="bg-surface-recessed min-h-72">
	<header class="border-neutral-muted bg-surface p-lg border-b">
		<div class="gap-lg flex items-center justify-between">
			<a href="/" class="text-xl font-semibold tracking-tight">northstar.</a>
			<nav aria-label="Primary navigation" class="gap-lg hidden items-center md:flex">
				<Button href="/components" variant="link" color="neutral">Components</Button><Button
					href="/blocks"
					variant="link"
					color="neutral">Blocks</Button
				><Button href="/docs" variant="link" color="neutral">Documentation</Button>
			</nav>
			<div class="gap-sm flex items-center">
				<Button href="/docs" size="small">Get started</Button><Button
					class="md:hidden"
					variant="ghost"
					prefix={listIcon}
					label="Toggle navigation"
					expanded={open}
					onclick={() => (open = !open)}
				/>
			</div>
		</div>
		{#if open}<nav
				aria-label="Mobile navigation"
				class="mt-lg gap-sm border-neutral-muted pt-lg flex flex-col items-start border-t md:hidden"
			>
				<Button href="/components" variant="ghost">Components</Button><Button
					href="/blocks"
					variant="ghost">Blocks</Button
				><Button href="/docs" variant="ghost">Documentation</Button>
			</nav>{/if}
	</header>
	<div class="gap-lg p-xl flex flex-col items-center text-center">
		<Chip variant="outline">Room for your product</Chip><Heading as="h2" size="h3"
			>Every good journey starts with a clear direction.</Heading
		>
	</div>
</section>
