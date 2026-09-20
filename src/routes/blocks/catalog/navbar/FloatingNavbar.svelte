<script lang="ts">
	import { Button } from 'entasis/button';
	import { Heading } from 'entasis/heading';
	import { Popover } from 'entasis/popover';
	import { bookOpenIcon } from 'entasis/icons/bookOpen';
	import { caretDownIcon } from 'entasis/icons/caretDown';
	import { listIcon } from 'entasis/icons/list';
	import { paletteIcon } from 'entasis/icons/palette';
	import { squaresFourIcon } from 'entasis/icons/squaresFour';
</script>

<section class="bg-primary-muted p-lg md:p-xl min-h-80">
	<header
		class="gap-md border-neutral-muted bg-surface p-md mx-auto flex max-w-5xl flex-wrap items-center justify-between rounded-full border"
	>
		<a href="/" class="px-md font-semibold">✳ Northstar</a>
		<nav aria-label="Primary navigation" class="gap-sm hidden items-center sm:flex">
			<Button href="/components" variant="ghost" size="small">Product</Button><Popover
				trigger={{ content: 'Resources', variant: 'ghost', size: 'small', suffix: caretDownIcon }}
				position="bottom-start"
				lockScroll={false}
				><nav aria-label="Resources" class="gap-sm flex min-w-56 flex-col">
					<Button href="/docs" variant="ghost" prefix={bookOpenIcon}>Documentation</Button><Button
						href="/blocks"
						variant="ghost"
						prefix={squaresFourIcon}>Block library</Button
					><Button href="/colors" variant="ghost" prefix={paletteIcon}>Color system</Button>
				</nav></Popover
			>
		</nav>
		<div class="gap-sm flex items-center">
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
				><nav aria-label="Mobile navigation" class="gap-sm flex min-w-48 flex-col">
					<Button href="/components" variant="ghost">Components</Button><Button
						href="/blocks"
						variant="ghost">Blocks</Button
					><Button href="/docs" variant="ghost">Guides</Button>
				</nav></Popover
			>
		</div>
	</header>
	<div class="gap-lg p-xl mx-auto flex max-w-xl flex-col items-center text-center">
		<Heading as="h2" size="h2" weight="bold">A little less friction.</Heading>
		<p class="text-neutral/70">Your product begins with a useful first step.</p>
	</div>
</section>
