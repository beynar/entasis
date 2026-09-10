<script lang="ts">
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	import { Popover } from 'svelai/popover';
	import { bookOpenIcon } from 'svelai/icons/bookOpen';
	import { caretDownIcon } from 'svelai/icons/caretDown';
	import { listIcon } from 'svelai/icons/list';
	import { paletteIcon } from 'svelai/icons/palette';
	import { squaresFourIcon } from 'svelai/icons/squaresFour';
</script>

<section class="min-h-80 bg-primary-muted p-lg md:p-xl">
	<header
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-md rounded-full border border-neutral-muted bg-surface p-md"
	>
		<a href="/" class="px-md font-semibold">✳ Northstar</a>
		<nav aria-label="Primary navigation" class="hidden items-center gap-sm sm:flex">
			<Button href="/components" variant="ghost" size="small">Product</Button><Popover
				trigger={{ children: 'Resources', variant: 'ghost', size: 'small', suffix: caretDownIcon }}
				position="bottom-start"
				lockScroll={false}
				><nav aria-label="Resources" class="flex min-w-56 flex-col gap-sm">
					<Button href="/docs" variant="ghost" prefix={bookOpenIcon}>Documentation</Button><Button
						href="/blocks"
						variant="ghost"
						prefix={squaresFourIcon}>Block library</Button
					><Button href="/colors" variant="ghost" prefix={paletteIcon}>Color system</Button>
				</nav></Popover
			>
		</nav>
		<div class="flex items-center gap-sm">
			<Button href="/docs" size="small">Start building</Button><Popover
				trigger={{
					prefix: listIcon,
					variant: 'ghost',
					size: 'small',
					label: 'Open navigation',
					class: 'sm:hidden'
				}}
				position="bottom-end"
				lockScroll={false}
				><nav aria-label="Mobile navigation" class="flex min-w-48 flex-col gap-sm">
					<Button href="/components" variant="ghost">Components</Button><Button
						href="/blocks"
						variant="ghost">Blocks</Button
					><Button href="/docs" variant="ghost">Guides</Button>
				</nav></Popover
			>
		</div>
	</header>
	<div class="mx-auto flex max-w-xl flex-col items-center gap-lg p-xl text-center">
		<Heading as="h2" size="h2" weight="bold">A little less friction.</Heading>
		<p class="text-neutral/60">Your product begins with a useful first step.</p>
	</div>
</section>
