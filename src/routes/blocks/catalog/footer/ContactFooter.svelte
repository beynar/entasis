<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Separator } from 'entasis/separator';
	import { arrowUpRightIcon } from 'entasis/icons/arrowUpRight';
</script>

<footer class="gap-xl bg-primary-muted p-lg md:p-xl flex flex-col">
	<div class="gap-xl grid items-end md:grid-cols-3">
		<div class="gap-xl flex flex-col items-start md:col-span-2">
			<Chip variant="outline">The next thing starts here</Chip><Heading
				as="h2"
				size="h1"
				weight="bold">Have an idea?<br />Give it a good beginning.</Heading
			><Button href="/blocks" size="large" suffix={arrowUpRightIcon}
				>Find your starting point</Button
			>
		</div>
		<nav aria-label="Explore the toolkit" class="gap-lg grid grid-cols-2 text-sm">
			<a href="/docs" class="hover:underline">Documentation</a><a
				href="/components"
				class="hover:underline">Components</a
			><a href="/blocks" class="hover:underline">Blocks</a><a href="/colors" class="hover:underline"
				>Colors</a
			>
		</nav>
	</div>
	<Separator />
	<div class="gap-lg flex flex-wrap items-center justify-between">
		<Heading as="h3" size="h4">Northstar®</Heading>
		<p class="text-neutral/70 text-sm">Independent thinking. Shared direction.</p>
		<p class="text-neutral/65 text-xs">An example brand, built with Entasis.</p>
	</div>
</footer>
