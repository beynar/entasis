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

<footer class="gap-xl border-neutral-muted p-lg md:p-xl flex flex-col border-t">
	<div class="gap-xl grid md:grid-cols-5">
		<div class="gap-lg flex flex-col items-start md:col-span-2">
			<Heading as="h2" size="h3" weight="bold">Northstar®</Heading>
			<p class="text-neutral/70 max-w-xs text-sm">
				Thoughtful tools for the people building what comes next.
			</p>
			<Chip size="small" variant="outline">Made with Svelai</Chip>
		</div>
		{#each columns as column (column.title)}<nav
				aria-label={column.title + ' footer links'}
				class="gap-md flex flex-col items-start"
			>
				<strong class="text-sm">{column.title}</strong>{#each column.links as link (link.href)}<a
						href={link.href}
						class="text-neutral/70 hover:text-primary-readable text-sm underline-offset-4 hover:underline"
						>{link.label}</a
					>{/each}
			</nav>{/each}
	</div>
	<Separator />
	<div class="gap-md text-neutral/65 flex flex-wrap justify-between text-xs">
		<p>© {year} Northstar. An example brand.</p>
		<p>A clear foundation for your next idea.</p>
		<a href="/docs" class="hover:text-primary-readable">Documentation</a>
	</div>
</footer>
