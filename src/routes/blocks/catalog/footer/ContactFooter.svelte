<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
</script>

<footer class="flex flex-col gap-xl bg-primary-muted p-lg md:p-xl">
	<div class="grid items-end gap-xl md:grid-cols-3">
		<div class="flex flex-col items-start gap-xl md:col-span-2">
			<Chip variant="outline">The next thing starts here</Chip><Heading
				as="h2"
				size="h1"
				weight="bold">Have an idea?<br />Give it a good beginning.</Heading
			><Button href="/blocks" size="large" suffix={arrowUpRightIcon}
				>Find your starting point</Button
			>
		</div>
		<nav aria-label="Explore the toolkit" class="grid grid-cols-2 gap-lg text-sm">
			<a href="/docs" class="hover:underline">Documentation</a><a
				href="/components"
				class="hover:underline">Components</a
			><a href="/blocks" class="hover:underline">Blocks</a><a href="/colors" class="hover:underline"
				>Colors</a
			>
		</nav>
	</div>
	<Separator />
	<div class="flex flex-wrap items-center justify-between gap-lg">
		<Heading as="h3" size="h4">Northstar®</Heading>
		<p class="text-sm text-neutral/60">Independent thinking. Shared direction.</p>
		<p class="text-xs text-neutral/50">An example brand, built with Svelai.</p>
	</div>
</footer>
