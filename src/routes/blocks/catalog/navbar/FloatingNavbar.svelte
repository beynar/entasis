<script lang="ts">
	import { Button } from 'entasis/button';
	import { Heading } from 'entasis/heading';
	import { NavigationMenu, type NavigationMenuItem } from 'entasis/navigation-menu';
	import { bookOpenIcon } from 'entasis/icons/bookOpen';
	import { listIcon } from 'entasis/icons/list';
	import { paletteIcon } from 'entasis/icons/palette';
	import { squaresFourIcon } from 'entasis/icons/squaresFour';

	const primaryItems: NavigationMenuItem[] = [
		{ type: 'link', label: 'Product', href: '/components' },
		{
			type: 'panel',
			value: 'resources',
			label: 'Resources',
			content: [
				{ label: 'Documentation', href: '/docs', prefix: bookOpenIcon },
				{ label: 'Block library', href: '/blocks', prefix: squaresFourIcon },
				{ label: 'Color system', href: '/colors', prefix: paletteIcon }
			]
		}
	];
	const mobileItems: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'menu',
			label: 'Open navigation',
			prefix: listIcon,
			iconOnly: true,
			content: [
				{ label: 'Components', href: '/components' },
				{ label: 'Blocks', href: '/blocks' },
				{ label: 'Guides', href: '/docs' }
			]
		}
	];
</script>

<section class="bg-primary-muted p-lg md:p-xl min-h-80">
	<header
		class="gap-md border-neutral-muted bg-surface p-md mx-auto flex max-w-5xl flex-wrap items-center justify-between rounded-full border"
	>
		<a href="/" class="px-md font-semibold">✳ Northstar</a>
		<NavigationMenu
			items={primaryItems}
			label="Primary navigation"
			size="small"
			class="hidden sm:block"
		/>
		<div class="gap-sm flex items-center">
			<Button href="/docs" size="small">Start building</Button><NavigationMenu
				items={mobileItems}
				label="Mobile navigation"
				size="small"
				class="sm:hidden"
			/>
		</div>
	</header>
	<div class="gap-lg p-xl mx-auto flex max-w-xl flex-col items-center text-center">
		<Heading as="h2" size="h2" weight="bold">A little less friction.</Heading>
		<p class="text-neutral/70">Your product begins with a useful first step.</p>
	</div>
</section>
