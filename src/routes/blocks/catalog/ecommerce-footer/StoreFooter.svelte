<script lang="ts">
	import { Button } from 'svelai/button';
	import { Select } from 'svelai/select';
	import { Chip } from 'svelai/chip';
	const groups = [
		{ title: 'Shop', links: ['New arrivals', 'Lighting', 'Objects', 'Everyday carry'] },
		{ title: 'Help', links: ['Delivery & returns', 'Care guide', 'FAQs', 'Contact'] },
		{ title: 'Field', links: ['Our story', 'Journal', 'Materials', 'Stockists'] }
	];
	let currency = $state('USD');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<footer class="flex flex-col gap-xl p-xl rounded-lg bg-surface-recessed">
		<div class="grid gap-xl lg:grid-cols-[1fr_2fr]">
			<div class="flex flex-col gap-xl">
				<a href="/components" class="text-2xl font-semibold tracking-wider">FIELD OBJECTS</a>
				<p class="max-w-sm text-neutral/65">
					Useful things. Quiet details. A little more care for everyday life.
				</p>
				<Button href="/docs" variant="outline" class="self-start">Read our journal ↗</Button>
			</div>
			<div class="grid grid-cols-2 gap-xl sm:grid-cols-3">
				{#each groups as group (group.title)}<div class="flex flex-col gap-lg">
						<h3 class="text-sm font-semibold">{group.title}</h3>
						{#each group.links as link (link)}<a
								href="/docs"
								class="text-sm text-neutral/60 hover:text-primary">{link}</a
							>{/each}
					</div>{/each}
			</div>
		</div>
		<div class="grid gap-xl border-y border-neutral/15 py-xl sm:grid-cols-2">
			<div>
				<p class="font-medium">Need a hand?</p>
				<p class="mt-md text-sm text-neutral/60">
					Our store guide covers delivery, returns, and product care.
				</p>
			</div>
			<Select
				label="Display currency"
				bind:value={currency}
				items={[
					{ value: 'USD', label: 'United States · USD' },
					{ value: 'EUR', label: 'Europe · EUR' },
					{ value: 'GBP', label: 'United Kingdom · GBP' }
				]}
			/>
		</div>
		<div class="flex gap-lg items-center justify-between flex-wrap text-xs text-neutral/50">
			<p>© 2026 Field Objects · {currency} selected</p>
			<div class="flex gap-lg">
				<a href="/docs">Privacy</a><a href="/docs">Terms</a><Chip
					size="small"
					variant="soft"
					color="neutral">Secure checkout</Chip
				>
			</div>
		</div>
	</footer>
</section>
