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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="overflow-hidden rounded-lg border border-neutral/15">
		<div
			class="flex gap-lg justify-between flex-wrap px-xl py-lg bg-surface-recessed text-xs text-neutral/60"
		>
			<span>Free delivery over $150</span>
			<div class="flex gap-xl"><a href="/docs">Store guide</a><a href="/docs">Support</a></div>
		</div>
		<div class="flex gap-xl items-center justify-between flex-wrap p-xl">
			<Button href="/docs" variant="ghost" color="neutral" size="small">Find a store</Button><a
				href="/components"
				class="text-2xl font-semibold tracking-widest">FIELD</a
			><Button href="/components" variant="outline" size="small">Explore products</Button>
		</div>
		<nav
			aria-label="Product categories"
			class="flex gap-lg justify-center flex-wrap p-lg border-y border-neutral/15"
		>
			{#each groups as group (group.title)}<Popover
					position="bottom"
					trigger={{ content: group.title, variant: 'ghost', color: 'neutral' }}
					><div class="flex flex-col gap-md">
						<p class="px-lg text-xs uppercase tracking-widest text-neutral/50">{group.title}</p>
						{#each group.links as link (link)}<Button
								href="/components"
								variant="ghost"
								color="neutral"
								class="justify-start">{link} →</Button
							>{/each}
					</div></Popover
				>{/each}<Button href="/docs" variant="ghost" color="danger">Archive sale</Button>
		</nav>
		<div class="flex flex-col gap-xl items-center p-xl text-center">
			<Chip class="w-fit" variant="soft">Considered essentials</Chip><Heading size="h3"
				>Find something worth keeping.</Heading
			>
			<p class="text-neutral/60">Explore lighting, objects, and useful everyday companions.</p>
		</div>
	</div>
</section>
