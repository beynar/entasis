<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let subtotal = $state(118);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg">
		<div class="gap-lg flex flex-wrap items-center justify-between">
			<div>
				<Heading size="h4"
					>{subtotal >= 150
						? 'Your delivery is on us.'
						: `You’re ${money(150 - subtotal)} from free delivery.`}</Heading
				>
				<p class="mt-md text-neutral/65 text-sm">A small addition can go a long way.</p>
			</div>
			<Chip variant="soft" color={subtotal >= 150 ? 'success' : 'primary'}
				>{money(subtotal)} in bag</Chip
			>
		</div>
		<Meter
			value={Math.min(150, subtotal)}
			color={subtotal >= 150 ? 'success' : 'primary'}
			max={150}
		/>
		<div class="gap-lg flex flex-wrap">
			<Button variant="outline" size="small" onclick={() => (subtotal += 24)}
				>Add a morning cup · $24</Button
			><Button variant="ghost" color="neutral" size="small" onclick={() => (subtotal = 118)}
				>Reset sample bag</Button
			>
		</div>
	</div>
</section>
