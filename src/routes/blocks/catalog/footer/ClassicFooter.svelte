<script lang="ts">
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	const year = new Date().getFullYear();
	const columns = [
		{
			title: 'Product',
			links: [
				{ label: 'Components', href: '/components' },
				{ label: 'Blocks', href: '/blocks' },
				{ label: 'Colors', href: '/colors' }
			]
		},
		{
			title: 'Learn',
			links: [
				{ label: 'Getting started', href: '/docs' },
				{ label: 'Examples', href: '/blocks' },
				{ label: 'Design tokens', href: '/colors' }
			]
		},
		{
			title: 'Explore',
			links: [
				{ label: 'Buttons', href: '/components/button' },
				{ label: 'Cards', href: '/components/card' },
				{ label: 'Forms', href: '/components/form' }
			]
		}
	];
</script>

<footer class="flex flex-col gap-xl border-t border-neutral-muted p-lg md:p-xl">
	<div class="grid gap-xl md:grid-cols-5">
		<div class="flex flex-col items-start gap-lg md:col-span-2">
			<Heading as="h2" size="h3" weight="bold">Northstar®</Heading>
			<p class="max-w-xs text-sm text-neutral/60">
				Thoughtful tools for the people building what comes next.
			</p>
			<Chip size="small" variant="outline">Made with Svelai</Chip>
		</div>
		{#each columns as column (column.title)}<nav
				aria-label={column.title + ' footer links'}
				class="flex flex-col items-start gap-md"
			>
				<strong class="text-sm">{column.title}</strong>{#each column.links as link (link.href)}<a
						href={link.href}
						class="text-sm text-neutral/60 underline-offset-4 hover:text-primary hover:underline"
						>{link.label}</a
					>{/each}
			</nav>{/each}
	</div>
	<Separator />
	<div class="flex flex-wrap justify-between gap-md text-xs text-neutral/50">
		<p>© {year} Northstar. An example brand.</p>
		<p>A clear foundation for your next idea.</p>
		<a href="/docs" class="hover:text-primary">Documentation</a>
	</div>
</footer>
