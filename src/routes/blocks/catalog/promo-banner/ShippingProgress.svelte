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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="flex flex-col gap-xl p-xl rounded-lg bg-surface-recessed">
		<div class="flex gap-lg items-center justify-between flex-wrap">
			<div>
				<Heading size="h4"
					>{subtotal >= 150
						? 'Your delivery is on us.'
						: `You’re ${money(150 - subtotal)} from free delivery.`}</Heading
				>
				<p class="mt-md text-sm text-neutral/55">A small addition can go a long way.</p>
			</div>
			<Chip variant="soft" color={subtotal >= 150 ? 'success' : 'primary'}
				>{money(subtotal)} in bag</Chip
			>
		</div>
		<Meter
			value={{ value: Math.min(150, subtotal), color: subtotal >= 150 ? 'success' : 'primary' }}
			max={150}
		/>
		<div class="flex gap-lg flex-wrap">
			<Button variant="outline" size="small" onclick={() => (subtotal += 24)}
				>Add a morning cup · $24</Button
			><Button variant="ghost" color="neutral" size="small" onclick={() => (subtotal = 118)}
				>Reset sample bag</Button
			>
		</div>
	</div>
</section>
