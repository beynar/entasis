<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	const groups = [
		{ title: 'Home', links: ['All homeware', 'Lighting', 'Vessels', 'Tableware'] },
		{ title: 'Wear', links: ['Everyday tees', 'Layers', 'Accessories'] },
		{ title: 'Carry', links: ['Totes', 'Pouches', 'Travel'] }
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="border-neutral/15 overflow-hidden rounded-lg border">
		<div
			class="gap-lg px-xl py-lg bg-surface-recessed text-neutral/70 flex flex-wrap justify-between text-xs"
		>
			<span>Free delivery over $150</span>
			<div class="gap-xl flex"><a href="/docs">Store guide</a><a href="/docs">Support</a></div>
		</div>
		<div class="gap-xl p-xl flex flex-wrap items-center justify-between">
			<Button href="/docs" variant="ghost" color="neutral" size="small">Find a store</Button><a
				href="/components"
				class="text-2xl font-semibold tracking-widest">FIELD</a
			><Button href="/components" variant="outline" size="small">Explore products</Button>
		</div>
		<nav
			aria-label="Product categories"
			class="gap-lg p-lg border-neutral/15 flex flex-wrap justify-center border-y"
		>
			{#each groups as group (group.title)}<Popover
					position="bottom"
					trigger={{ content: group.title, variant: 'ghost', color: 'neutral' }}
					><div class="gap-md flex flex-col">
						<p class="px-lg text-neutral/65 text-xs tracking-widest uppercase">{group.title}</p>
						{#each group.links as link (link)}<Button
								href="/components"
								variant="ghost"
								color="neutral"
								class="justify-start">{link} →</Button
							>{/each}
					</div></Popover
				>{/each}<Button href="/docs" variant="ghost" color="danger">Archive sale</Button>
		</nav>
		<div class="gap-xl p-xl flex flex-col items-center text-center">
			<Chip class="w-fit" variant="soft">Considered essentials</Chip><Heading size="h3"
				>Find something worth keeping.</Heading
			>
			<p class="text-neutral/70">Explore lighting, objects, and useful everyday companions.</p>
		</div>
	</div>
</section>
