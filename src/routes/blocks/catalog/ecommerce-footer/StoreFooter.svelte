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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<footer class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg">
		<div class="gap-xl grid lg:grid-cols-[1fr_2fr]">
			<div class="gap-xl flex flex-col">
				<a href="/components" class="text-2xl font-semibold tracking-wider">FIELD OBJECTS</a>
				<p class="text-neutral/65 max-w-sm">
					Useful things. Quiet details. A little more care for everyday life.
				</p>
				<Button href="/docs" variant="outline" class="self-start">Read our journal ↗</Button>
			</div>
			<div class="gap-xl grid grid-cols-2 sm:grid-cols-3">
				{#each groups as group (group.title)}<div class="gap-lg flex flex-col">
						<h3 class="text-sm font-semibold">{group.title}</h3>
						{#each group.links as link (link)}<a
								href="/docs"
								class="text-neutral/70 hover:text-primary-readable text-sm">{link}</a
							>{/each}
					</div>{/each}
			</div>
		</div>
		<div class="gap-xl border-neutral/15 py-xl grid border-y sm:grid-cols-2">
			<div>
				<p class="font-medium">Need a hand?</p>
				<p class="mt-md text-neutral/70 text-sm">
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
		<div class="gap-lg text-neutral/65 flex flex-wrap items-center justify-between text-xs">
			<p>© 2026 Field Objects · {currency} selected</p>
			<div class="gap-lg flex">
				<a href="/docs">Privacy</a><a href="/docs">Terms</a><Chip
					size="small"
					variant="soft"
					color="neutral">Secure checkout</Chip
				>
			</div>
		</div>
	</footer>
</section>
