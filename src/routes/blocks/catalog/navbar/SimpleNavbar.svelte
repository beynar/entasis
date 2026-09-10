<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { listIcon } from 'svelai/icons/list';
	let open = $state(false);
</script>

<section class="min-h-72 bg-surface-recessed">
	<header class="border-b border-neutral-muted bg-surface p-lg">
		<div class="flex items-center justify-between gap-lg">
			<a href="/" class="text-xl font-semibold tracking-tight">northstar.</a>
			<nav aria-label="Primary navigation" class="hidden items-center gap-lg md:flex">
				<Button href="/components" variant="link" color="neutral">Components</Button><Button
					href="/blocks"
					variant="link"
					color="neutral">Blocks</Button
				><Button href="/docs" variant="link" color="neutral">Documentation</Button>
			</nav>
			<div class="flex items-center gap-sm">
				<Button href="/docs" size="small">Get started</Button><Button
					class="md:hidden"
					variant="ghost"
					prefix={listIcon}
					label="Toggle navigation"
					aria-expanded={open}
					onclick={() => (open = !open)}
				/>
			</div>
		</div>
		{#if open}<nav
				aria-label="Mobile navigation"
				class="mt-lg flex flex-col items-start gap-sm border-t border-neutral-muted pt-lg md:hidden"
			>
				<Button href="/components" variant="ghost">Components</Button><Button
					href="/blocks"
					variant="ghost">Blocks</Button
				><Button href="/docs" variant="ghost">Documentation</Button>
			</nav>{/if}
	</header>
	<div class="flex flex-col items-center gap-lg p-xl text-center">
		<Chip variant="outline">Room for your product</Chip><Heading as="h2" size="h3"
			>Every good journey starts with a clear direction.</Heading
		>
	</div>
</section>
